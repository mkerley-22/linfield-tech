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

    // Resend webhook structure may vary - log the full data to understand it
    console.log('Resend webhook data structure:', JSON.stringify(data, null, 2))
    
    // Extract email fields - Resend may structure this differently
    const from = data.from || data.from_email || data.sender
    const to = data.to || data.to_email || data.recipient
    const subject = data.subject
    const text = data.text || data.text_body || data.body_text || data.plain_text
    const html = data.html || data.html_body || data.body_html
    const headers = data.headers || {}

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
    // Sender email already verified when we found the request by requesterEmail

    // Extract message content (prefer text, fallback to HTML)
    // Ensure text and html are strings
    const textStr = typeof text === 'string' ? text : (text?.toString() || '')
    const htmlStr = typeof html === 'string' ? html : (html?.toString() || '')
    let messageContent = textStr || ''
    
    if (!messageContent && htmlStr) {
      // Simple HTML to text conversion (remove tags but preserve line breaks)
      messageContent = htmlStr
        .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
        .replace(/<\/p>/gi, '\n\n') // Convert </p> to double newlines
        .replace(/<[^>]*>/g, '') // Remove all other HTML tags
        .replace(/&nbsp;/g, ' ') // Convert &nbsp; to spaces
        .replace(/&amp;/g, '&') // Convert &amp; to &
        .replace(/&lt;/g, '<') // Convert &lt; to <
        .replace(/&gt;/g, '>') // Convert &gt; to >
        .replace(/&quot;/g, '"') // Convert &quot; to "
        .trim()
    }

    // Remove email signature/quoted text (common patterns)
    // But be less aggressive - only remove if we have enough content
    if (messageContent.length > 50) {
      // Only clean up if we have substantial content
      messageContent = messageContent
        .split(/On .* wrote:/i)[0] // Remove "On [date] [person] wrote:"
        .split(/-----Original Message-----/i)[0] // Remove "-----Original Message-----"
        .split(/From:.*/i)[0] // Remove "From: ..."
        .split(/Sent:.*/i)[0] // Remove "Sent: ..."
        .split(/Date:.*/i)[0] // Remove "Date: ..."
        .split(/Subject:.*/i)[0] // Remove "Subject: ..."
        .split(/To:.*/i)[0] // Remove "To: ..."
        .replace(/^>+\s*/gm, '') // Remove quote markers (lines starting with >)
        .trim()
    }

    // Log the extracted content for debugging
    console.log('Extracted message content:', {
      originalTextLength: textStr.length,
      originalHtmlLength: htmlStr.length,
      extractedLength: messageContent.length,
      preview: messageContent.substring(0, 100),
    })

    // If still no content, check alternative field names
    if (!messageContent) {
      const body = data.body || data.content || data.message || data.text_content
      if (body) {
        messageContent = typeof body === 'string' ? body : JSON.stringify(body)
        console.log('Found content in alternative field (body/content/message):', messageContent.substring(0, 100))
      }
    }
    
    if (!messageContent || messageContent.length < 3) {
      console.log('Message content too short or empty after extraction:', {
        textStr: textStr.substring(0, 200),
        htmlStr: htmlStr.substring(0, 200),
        messageContent,
        fullDataKeys: Object.keys(data),
        fullDataSample: JSON.stringify(data).substring(0, 500),
      })
      return NextResponse.json({ received: true, error: 'Message too short' })
    }

    // Create message in database
    await prisma.checkoutRequestMessage.create({
      data: {
        id: crypto.randomUUID(),
        checkoutRequestId: requestId,
        senderType: 'requester',
        senderName: checkoutRequest.requesterName,
        senderEmail: senderEmailStr,
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

