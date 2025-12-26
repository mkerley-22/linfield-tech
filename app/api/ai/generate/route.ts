import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey: providedApiKey } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Use provided API key (for testing) or fall back to environment variable
    const apiKey = providedApiKey || process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error('OpenAI API key not found. Provided key:', !!providedApiKey, 'Env key:', !!process.env.OPENAI_API_KEY)
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file or configure it in Settings.' },
        { status: 500 }
      )
    }

    // Create OpenAI client with the API key
    const openaiClient = new OpenAI({
      apiKey: apiKey,
    })

    const systemPrompt = `You are a helpful assistant for creating technical documentation for Linfield Christian School in Temecula, CA. 
Generate well-structured, clear, and professional content in HTML format. Use proper HTML tags like <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, and <a>.
Keep the content educational, accurate, and suitable for a school technology knowledge base.`

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini as it's more reliable and cost-effective
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const content = completion.choices[0]?.message?.content || ''

    if (!content) {
      return NextResponse.json(
        { error: 'No content generated. Please try again with a different prompt.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('AI generation error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate content'
    if (error.status === 401 || error.message?.includes('Incorrect API key')) {
      errorMessage = 'Invalid API key. Please check your OpenAI API key in Settings.'
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

