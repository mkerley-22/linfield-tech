import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Resend webhook for incoming emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Resend webhook format
    // See: https://resend.com/docs/dashboard/webhooks
    const { type, data } = body

    if (type !== 'email.received') {
      return NextResponse.json({ received: true })
    }

    const { from, to, subject, text, html, headers } = data

    // Extract sender email
    const senderEmail = from?.email || from
    const senderEmailStr = typeof senderEmail === 'string' ? senderEmail : (senderEmail?.toString() || '')
    
    if (!senderEmailStr) {
      console.log('No sender email found in webhook')
      return NextResponse.json({ received: true, error: 'No sender email' })
    }

    // Find the most recent active checkout request for this sender
    // Active means: not picked up, not denied, or recently updated
    const checkoutRequest = await prisma.checkoutRequest.findFirst({
      where: {
        requesterEmail: senderEmailStr.toLowerCase(),
        status: {
          not: 'denied',
        },
        OR: [
          { pickedUp: false },
          { pickedUpAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Picked up within last 7 days
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    if (!checkoutRequest) {
      console.log('No active checkout request found for sender:', senderEmailStr)
      return NextResponse.json({ received: true, error: 'No active request found for this email' })
    }

    const requestId = checkoutRequest.id

    if (!checkoutRequest) {
      console.log('Checkout request not found:', requestId)
      return NextResponse.json({ received: true, error: 'Request not found' })
    }

    // Verify the sender email matches the requester
    const senderEmail = from?.email || from
    if (senderEmail.toLowerCase() !== checkoutRequest.requesterEmail.toLowerCase()) {
      console.log('Sender email does not match requester:', {
        sender: senderEmail,
        requester: checkoutRequest.requesterEmail,
      })
      // Still allow it, but log it
    }

    // Extract message content (prefer text, fallback to HTML)
    // Ensure text and html are strings
    const textStr = typeof text === 'string' ? text : (text?.toString() || '')
    const htmlStr = typeof html === 'string' ? html : (html?.toString() || '')
    let messageContent = textStr || ''
    if (!messageContent && htmlStr) {
      // Simple HTML to text conversion (remove tags)
      messageContent = htmlStr.replace(/<[^>]*>/g, '').trim()
    }

    // Remove email signature/quoted text (common patterns)
    messageContent = messageContent
      .split(/On .* wrote:/i)[0] // Remove "On [date] [person] wrote:"
      .split(/From:.*/i)[0] // Remove "From: ..."
      .split(/Sent:.*/i)[0] // Remove "Sent: ..."
      .trim()

    if (!messageContent || messageContent.length < 3) {
      console.log('Message content too short or empty')
      return NextResponse.json({ received: true, error: 'Message too short' })
    }

    // Create message in database
    await prisma.checkoutRequestMessage.create({
      data: {
        id: crypto.randomUUID(),
        checkoutRequestId: requestId,
        senderType: 'requester',
        senderName: checkoutRequest.requesterName,
        senderEmail: senderEmail,
        message: messageContent,
      },
    })

    // Trigger UI refresh event (if needed)
    // The checkout page will refresh when user navigates back

    console.log('Email reply processed and added to checkout request:', requestId)

    return NextResponse.json({ received: true, success: true })
  } catch (error: any) {
    console.error('Email webhook error:', error)
    // Return 200 so Resend doesn't retry
    return NextResponse.json({ received: true, error: error.message })
  }
}

// Handle GET for webhook verification (if needed)
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok', message: 'Email webhook endpoint' })
}

