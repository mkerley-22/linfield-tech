import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check if there's a GoogleAuth record
    const auth = await prisma.googleAuth.findUnique({
      where: { userId: 'default' },
    })

    return NextResponse.json({
      connected: !!auth,
      hasToken: !!auth?.accessToken,
    })
  } catch (error: any) {
    console.error('Check Google status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    )
  }
}

