import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Test the API key by making a simple request
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'test' },
        ],
        max_tokens: 5,
      })

      // If we get here, the API key is valid
      return NextResponse.json({ 
        valid: true,
        message: 'API key is valid' 
      })
    } catch (error: any) {
      // Check if it's an authentication error
      if (error.status === 401 || error.message?.includes('Incorrect API key')) {
        return NextResponse.json(
          { valid: false, error: 'Invalid API key' },
          { status: 401 }
        )
      }
      throw error
    }
  } catch (error: any) {
    console.error('Test API key error:', error)
    return NextResponse.json(
      { valid: false, error: error.message || 'Failed to test API key' },
      { status: 500 }
    )
  }
}

