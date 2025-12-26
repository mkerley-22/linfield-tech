import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { sendCheckoutRequestMessage } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const checkoutRequest = await prisma.checkoutRequest.findUnique({
      where: { id: params.id },
    })

    if (!checkoutRequest) {
      return NextResponse.json(
        { error: 'Checkout request not found' },
        { status: 404 }
      )
    }

    const newMessage = await prisma.checkoutRequestMessage.create({
      data: {
        checkoutRequestId: params.id,
        senderType: 'admin',
        senderName: user.name || user.email || 'Admin',
        senderEmail: user.email || null,
        message: message.trim(),
      },
    })

    // Send email notification to requester
    try {
      await sendCheckoutRequestMessage(
        checkoutRequest.requesterEmail,
        checkoutRequest.requesterName,
        checkoutRequest.id,
        newMessage.senderName,
        newMessage.message
      )
    } catch (error) {
      console.error('Failed to send message email:', error)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error: any) {
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create message' },
      { status: 500 }
    )
  }
}

