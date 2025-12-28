import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { pickupDate, pickupTime, pickupLocation } = body

    if (!pickupDate || !pickupTime || !pickupLocation) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const checkoutRequest = await prisma.checkoutRequest.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!checkoutRequest) {
      return NextResponse.json(
        { error: 'Checkout request not found' },
        { status: 404 }
      )
    }

    if (!checkoutRequest.readyForPickup) {
      return NextResponse.json(
        { error: 'This request is not ready for pickup yet' },
        { status: 400 }
      )
    }

    const updated = await prisma.checkoutRequest.update({
      where: { id: resolvedParams.id },
      data: {
        pickupDate: new Date(pickupDate),
        pickupTime: pickupTime,
        pickupLocation: pickupLocation,
      },
    })

    return NextResponse.json({ success: true, request: updated })
  } catch (error: any) {
    console.error('Schedule pickup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to schedule pickup' },
      { status: 500 }
    )
  }
}


