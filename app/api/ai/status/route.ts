import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured in environment
    const hasApiKey = !!process.env.OPENAI_API_KEY

    return NextResponse.json({
      configured: hasApiKey,
    })
  } catch (error: any) {
    console.error('Check AI status error:', error)
    return NextResponse.json({
      configured: false,
    })
  }
}

