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

    // Extract checkout request ID from reply-to or subject
    // Format: "checkout-{requestId}@tech.linfieldtechhub.com" or subject contains request ID
    let requestId: string | null = null

    // Try to extract from reply-to header
    // Ensure replyTo is a string
    const replyTo = headers?.['reply-to'] || headers?.['Reply-To'] || to
    const replyToStr = typeof replyTo === 'string' ? replyTo : (replyTo?.email || replyTo?.toString() || '')
    if (replyToStr) {
      const match = replyToStr.match(/checkout-([a-f0-9-]+)@/)
      if (match) {
        requestId = match[1]
      }
    }

    // Request ID should be extracted from reply-to email address
    // Format: checkout-{requestId}@tech.linfieldtechhub.com
    // We no longer include request ID in subject line for user-friendliness

    if (!requestId) {
      console.log('Could not extract request ID from email:', { 
        from, 
        to, 
        subject: subjectStr,
        replyTo: replyToStr,
        headers: JSON.stringify(headers),
      })
      return NextResponse.json({ received: true, error: 'No request ID found' })
    }

    // Find the checkout request
    const checkoutRequest = await prisma.checkoutRequest.findUnique({
      where: { id: requestId },
    })

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

