import { NextRequest, NextResponse } from 'next/server'
import { analyzeInventoryImage } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const analysis = await analyzeInventoryImage(imageUrl)

    return NextResponse.json({ analysis })
  } catch (error: any) {
    console.error('Image analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    )
  }
}

