import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ImageAnalysisResult {
  equipmentType?: string
  brand?: string
  model?: string
  suggestedTags: string[]
  description?: string
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  conditionNotes?: string
  serialNumbers?: string[]
}

interface SmartSearchResult {
  items: any[]
  query: string
  interpretedQuery: string
}

/**
 * Analyze an image to extract equipment information
 */
export async function analyzeInventoryImage(imageUrl: string): Promise<ImageAnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at identifying audio/visual equipment from photos. Analyze images and extract:
1. Equipment type (microphone, speaker, mixer, etc.)
2. Brand/manufacturer name
3. Model number if visible
4. Suggested tags (audio, video, lighting, etc.)
5. A brief description
6. Condition assessment (excellent, good, fair, poor, damaged)
7. Any visible serial numbers
8. Condition notes if damage is visible

Return structured information in a helpful format.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this equipment image and extract all relevant information including type, brand, model, condition, and any visible serial numbers.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content || ''
    
    // Parse the response to extract structured data
    const result: ImageAnalysisResult = {
      suggestedTags: [],
      serialNumbers: [],
    }

    // Extract equipment type
    const typeMatch = content.match(/[Ee]quipment [Tt]ype[:\s]+([^\n]+)/i) || 
                     content.match(/[Tt]ype[:\s]+([^\n]+)/i)
    if (typeMatch) result.equipmentType = typeMatch[1].trim()

    // Extract brand
    const brandMatch = content.match(/[Bb]rand[:\s]+([^\n]+)/i) || 
                      content.match(/[Mm]anufacturer[:\s]+([^\n]+)/i)
    if (brandMatch) result.brand = brandMatch[1].trim()

    // Extract model
    const modelMatch = content.match(/[Mm]odel[:\s]+([^\n]+)/i)
    if (modelMatch) result.model = modelMatch[1].trim()

    // Extract description
    const descMatch = content.match(/[Dd]escription[:\s]+([^\n]+(?:\n[^\n]+)*?)(?=\n[A-Z]|$)/i)
    if (descMatch) result.description = descMatch[1].trim()

    // Extract condition
    const conditionMatch = content.match(/[Cc]ondition[:\s]+(excellent|good|fair|poor|damaged)/i)
    if (conditionMatch) {
      result.condition = conditionMatch[1].toLowerCase() as ImageAnalysisResult['condition']
    }

    // Extract condition notes
    const conditionNotesMatch = content.match(/[Cc]ondition [Nn]otes[:\s]+([^\n]+(?:\n[^\n]+)*?)(?=\n[A-Z]|$)/i)
    if (conditionNotesMatch) result.conditionNotes = conditionNotesMatch[1].trim()

    // Extract serial numbers
    const serialMatch = content.match(/[Ss]erial [Nn]umber[s]?[:\s]+([^\n]+)/i)
    if (serialMatch) {
      result.serialNumbers = serialMatch[1].split(/[,\s]+/).filter(s => s.trim())
    }

    // Extract tags
    const tagsMatch = content.match(/[Tt]ags?[:\s]+([^\n]+)/i)
    if (tagsMatch) {
      result.suggestedTags = tagsMatch[1].split(/[,\s]+/).filter(t => t.trim())
    }

    // If structured parsing fails, use LLM to extract JSON
    if (!result.equipmentType && !result.brand) {
      const jsonResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Extract equipment information from the image analysis. Return ONLY valid JSON with keys: equipmentType, brand, model, suggestedTags (array), description, condition, conditionNotes, serialNumbers (array).'
          },
          {
            role: 'user',
            content: content
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
      })

      try {
        const jsonData = JSON.parse(jsonResponse.choices[0]?.message?.content || '{}')
        return { ...result, ...jsonData }
      } catch (e) {
        console.error('Failed to parse JSON response:', e)
      }
    }

    return result
  } catch (error: any) {
    console.error('Image analysis error:', error)
    throw new Error(`Failed to analyze image: ${error.message}`)
  }
}

/**
 * Generate description from image
 */
export async function generateDescriptionFromImage(imageUrl: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Generate a brief, professional description of this equipment item based on the image. Focus on key features and typical use cases.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate a description for this equipment item.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content || ''
  } catch (error: any) {
    console.error('Description generation error:', error)
    throw new Error(`Failed to generate description: ${error.message}`)
  }
}

/**
 * Smart search - interpret natural language queries
 */
export async function smartSearch(query: string, items: any[]): Promise<SmartSearchResult> {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback to basic search
    return {
      items: items.filter(item => 
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(query.toLowerCase()) ||
        item.model?.toLowerCase().includes(query.toLowerCase())
      ),
      query,
      interpretedQuery: query,
    }
  }

  try {
    // First, interpret the query
    const interpretation = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a search assistant for an inventory system. Interpret user queries and extract:
- Equipment type/category
- Brand/manufacturer
- Location
- Tags
- Any other relevant filters

Return a JSON object with search criteria.`
        },
        {
          role: 'user',
          content: `Interpret this search query: "${query}"`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })

    const criteria = JSON.parse(interpretation.choices[0]?.message?.content || '{}')
    
    // Filter items based on interpreted criteria
    const filtered = items.filter(item => {
      if (criteria.equipmentType && !item.name?.toLowerCase().includes(criteria.equipmentType.toLowerCase())) {
        return false
      }
      if (criteria.brand && item.manufacturer?.toLowerCase() !== criteria.brand.toLowerCase()) {
        return false
      }
      if (criteria.location && item.location?.toLowerCase() !== criteria.location.toLowerCase()) {
        return false
      }
      if (criteria.tags && Array.isArray(item.tags)) {
        const itemTags = item.tags.map((t: any) => t.tag?.name?.toLowerCase() || '').join(' ')
        if (!criteria.tags.some((tag: string) => itemTags.includes(tag.toLowerCase()))) {
          return false
        }
      }
      return true
    })

    return {
      items: filtered,
      query,
      interpretedQuery: JSON.stringify(criteria),
    }
  } catch (error: any) {
    console.error('Smart search error:', error)
    // Fallback to basic search
    return {
      items: items.filter(item => 
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(query.toLowerCase())
      ),
      query,
      interpretedQuery: query,
    }
  }
}

/**
 * Chat with inventory assistant
 */
export async function chatWithAssistant(message: string, context: { items: any[], recentCheckouts?: any[] }): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return 'AI assistant is not configured. Please add OPENAI_API_KEY to your environment variables.'
  }

  try {
    const itemSummary = context.items.slice(0, 50).map(item => ({
      name: item.name,
      manufacturer: item.manufacturer,
      location: item.location,
      available: item.availableForCheckout || item.quantity,
    }))

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful inventory assistant for an AV equipment management system. You can help users:
- Find equipment
- Check availability
- Suggest items for events
- Answer questions about inventory

Current inventory summary: ${JSON.stringify(itemSummary)}
Be concise and helpful.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500,
    })

    return response.choices[0]?.message?.content || 'I apologize, I could not process your request.'
  } catch (error: any) {
    console.error('Chat error:', error)
    return `Error: ${error.message}`
  }
}

/**
 * Clean and standardize data
 */
export async function cleanInventoryData(data: { name?: string, manufacturer?: string, model?: string }): Promise<{ name: string, manufacturer: string, model: string }> {
  if (!process.env.OPENAI_API_KEY) {
    // Basic cleaning without AI
    return {
      name: data.name?.trim() || '',
      manufacturer: data.manufacturer?.trim() || '',
      model: data.model?.trim() || '',
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Clean and standardize inventory data. Fix typos, standardize brand names (e.g., "Shure" not "shure" or "SHURE"), and format consistently. Return JSON with cleaned name, manufacturer, and model.`
        },
        {
          role: 'user',
          content: `Clean this data: ${JSON.stringify(data)}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })

    const cleaned = JSON.parse(response.choices[0]?.message?.content || '{}')
    return {
      name: cleaned.name || data.name?.trim() || '',
      manufacturer: cleaned.manufacturer || data.manufacturer?.trim() || '',
      model: cleaned.model || data.model?.trim() || '',
    }
  } catch (error: any) {
    console.error('Data cleaning error:', error)
    return {
      name: data.name?.trim() || '',
      manufacturer: data.manufacturer?.trim() || '',
      model: data.model?.trim() || '',
    }
  }
}

