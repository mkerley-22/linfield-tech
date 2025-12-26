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
    const eventId = resolvedParams.id

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Build context from event description
    const eventContext = `
Event Title: ${event.title}
Description: ${event.description || 'No description provided'}
Location: ${event.location || 'Not specified'}
Start Time: ${event.startTime}
End Time: ${event.endTime}
Event Type: ${event.eventType}
`

    // Use AI to analyze equipment needs
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a technical equipment specialist for a school. Analyze event descriptions and determine what equipment is needed, including all supporting items. Return a JSON object with an "equipment" array. Each equipment item should have:
- name: The equipment name (e.g., "Speakers", "Microphone", "Computer", "Audio Mixer", "XLR Cables", "Power Cables", "Speaker Stands")
- description: A brief description of what's needed and how it will be used (e.g., "Music playing, no DJ needed", "Wireless mic for presenter", "Laptop for slideshow")
- quantity: The number of items needed (e.g., 2, 4, 1). Always include a quantity, even if it's 1.
- category: One of "audio", "video", "lighting", "cables", "stands", "power", "computer", "other"

IMPORTANT: Include ALL necessary supporting equipment:
- For speakers: Include speaker stands, power cables, XLR cables (for connecting to mixers), and any needed mixers
- For microphones: Include XLR cables (for connecting to mixers), stands, power if needed
- For mixers: Include XLR cables for connecting inputs and outputs (mixers connect with XLR cables, not 1/4" cables)
- For video: Include cables (HDMI, VGA, etc.), power cables, mounts/stands
- For lighting: Include power cables, DMX cables, stands/mounts, dimmers if needed
- Always include power cables/extension cords if equipment needs power
- Include cable management items if multiple cables are needed

Note: This school uses XLR cables for audio connections, especially for connecting microphones and speakers to mixers.

Be comprehensive and practical. Think about what a technician would actually need to set up and run the event. Return ONLY valid JSON in this format:
{
  "equipment": [
    {
      "name": "Speakers",
      "description": "For playing music during the event",
      "quantity": 2,
      "category": "audio"
    },
    {
      "name": "Speaker Stands",
      "description": "To elevate speakers for better sound distribution",
      "quantity": 2,
      "category": "stands"
    },
    {
      "name": "XLR Cables",
      "description": "To connect speakers to audio source",
      "quantity": 2,
      "category": "cables"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Analyze this event and determine what equipment is needed, including all supporting items (cables, stands, power cables, mixers, etc.) and quantities:\n\n${eventContext}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from AI')
    }

    const parsed = JSON.parse(responseContent)
    const equipment = Array.isArray(parsed.equipment) 
      ? parsed.equipment 
      : []

    return NextResponse.json({ equipment })
  } catch (error: any) {
    console.error('Equipment analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze equipment' },
      { status: 500 }
    )
  }
}

