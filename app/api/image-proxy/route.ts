import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint to fetch images and handle CORS issues
 * Usage: /api/image-proxy?url=https://example.com/image.jpg
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(imageUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      )
    }

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.startsWith('image/')) {
      return NextResponse.json(
        { error: 'URL does not point to an image' },
        { status: 400 }
      )
    }

    const imageBuffer = await response.arrayBuffer()

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    console.error('Image proxy error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to proxy image' },
      { status: 500 }
    )
  }
}

