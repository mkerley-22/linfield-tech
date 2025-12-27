import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { connected: false, hasToken: false },
        { status: 200 }
      )
    }

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
    // Return safe default instead of error to prevent render failures
    return NextResponse.json({
      connected: false,
      hasToken: false,
    })
  }
}

