import { NextRequest, NextResponse } from 'next/server'
import { cleanInventoryData } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data) {
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      )
    }

    const cleaned = await cleanInventoryData({
      name: data.name,
      manufacturer: data.manufacturer,
      model: data.model,
    })

    return NextResponse.json({ cleaned })
  } catch (error: any) {
    console.error('Data cleaning error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to clean data' },
      { status: 500 }
    )
  }
}

