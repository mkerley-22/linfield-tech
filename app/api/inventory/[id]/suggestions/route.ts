import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const itemId = resolvedParams.id

    // Get the selected item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        InventoryItemTag: {
          include: {
            InventoryTag: true,
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { suggestions: [] },
        { status: 200 }
      )
    }

    // Get all available items for context
    const allItems = await prisma.inventoryItem.findMany({
      where: {
        checkoutEnabled: true,
        id: { not: itemId }, // Exclude the current item
      },
      include: {
        InventoryItemTag: {
          include: {
            InventoryTag: true,
          },
        },
        Checkout: {
          where: {
            status: 'checked_out',
          },
        },
      },
      take: 50, // Limit to 50 items for context
    })

    // Calculate available quantities
    const availableItems = allItems.map(i => ({
      id: i.id,
      name: i.name,
      description: i.description,
      manufacturer: i.manufacturer,
      model: i.model,
      tags: i.InventoryItemTag.map(t => t.InventoryTag.name),
      available: Math.max(0, i.quantity - i.Checkout.length),
    }))

    // Build prompt for AI
    const itemDescription = `${item.name}${item.manufacturer ? ` by ${item.manufacturer}` : ''}${item.model ? ` (${item.model})` : ''}${item.description ? `. ${item.description}` : ''}`
    const tags = item.InventoryItemTag.map(t => t.InventoryTag.name).join(', ')

    const prompt = `You are an expert in audio/visual equipment and technology. A user is checking out this equipment item:

Item: ${itemDescription}
${tags ? `Tags: ${tags}` : ''}

Based on this item, suggest 2-4 complementary items that are typically needed to use this equipment effectively. For example:
- If it's a speaker, suggest cables (XLR, speaker wire), stands, power cables, etc.
- If it's a microphone, suggest cables, stands, pop filters, etc.
- If it's a projector, suggest cables, screens, mounts, etc.
- If it's a camera, suggest batteries, memory cards, tripods, etc.

Available items in inventory:
${availableItems.map(i => `- ${i.name}${i.manufacturer ? ` (${i.manufacturer})` : ''}${i.description ? `: ${i.description}` : ''}${i.tags.length > 0 ? ` [Tags: ${i.tags.join(', ')}]` : ''} [Available: ${i.available}]`).join('\n')}

Return ONLY a JSON array of suggested item names (exact matches from the available items list above). Format:
["Item Name 1", "Item Name 2", "Item Name 3"]

If no good matches exist in the available items, return an empty array [].`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that suggests complementary equipment. Always return valid JSON arrays only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
      })

      const content = completion.choices[0]?.message?.content || '[]'
      let suggestedNames: string[] = []

      try {
        // Try to parse the JSON response
        suggestedNames = JSON.parse(content.trim())
        if (!Array.isArray(suggestedNames)) {
          suggestedNames = []
        }
      } catch {
        // If parsing fails, try to extract item names from text
        const matches = content.match(/"([^"]+)"/g)
        if (matches) {
          suggestedNames = matches.map(m => m.replace(/"/g, ''))
        }
      }

      // Find matching items from available items
      const suggestions = suggestedNames
        .map(name => {
          // Try exact match first
          let match = availableItems.find(i => 
            i.name.toLowerCase() === name.toLowerCase()
          )
          
          // Try partial match if exact fails
          if (!match) {
            match = availableItems.find(i => 
              i.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(i.name.toLowerCase())
            )
          }
          
          return match
        })
        .filter(Boolean)
        .slice(0, 4) // Limit to 4 suggestions
        .map(item => ({
          id: item!.id,
          name: item!.name,
          description: item!.description,
          manufacturer: item!.manufacturer,
          model: item!.model,
          available: item!.available,
          tags: item!.tags,
        }))

      return NextResponse.json({ suggestions })
    } catch (aiError: any) {
      console.error('AI suggestion error:', aiError)
      // Return empty suggestions if AI fails
      return NextResponse.json({ suggestions: [] })
    }
  } catch (error: any) {
    console.error('Get suggestions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get suggestions' },
      { status: 500 }
    )
  }
}

