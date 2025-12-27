import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

// Lazy initialization - only create client when needed
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// Validate that a URL is actually an image
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    const contentType = response.headers.get('content-type')
    return contentType?.startsWith('image/') || false
  } catch (error) {
    console.error('Error validating image URL:', url, error)
    return false
  }
}

// Fetch image from Google Custom Search API
async function fetchImageFromGoogle(manufacturer: string, model: string, productName: string): Promise<string | null> {
  const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID

  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.log('Google Custom Search API not configured, falling back to AI')
    return null
  }

  try {
    const searchQuery = `${manufacturer} ${model} product image`
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=10&safe=active&imgSize=large&imgType=photo`

    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Custom Search API error:', response.status, errorText)
      return null
    }

    const data = await response.json()
    if (data.items && data.items.length > 0) {
      // Try to find a valid image URL
      for (const item of data.items) {
        const imageUrl = item.link
        // Check if it's a direct image URL (common image extensions)
        if (imageUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(imageUrl)) {
          // Validate it's actually an image
          if (await validateImageUrl(imageUrl)) {
            console.log('Found valid image URL from Google:', imageUrl)
            return imageUrl
          }
        }
      }
      // If no direct image URL found, try the first result anyway
      const firstUrl = data.items[0].link
      if (await validateImageUrl(firstUrl)) {
        console.log('Found valid image URL from Google (non-direct):', firstUrl)
        return firstUrl
      }
    }
  } catch (error) {
    console.error('Error fetching image from Google:', error)
  }

  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const inventoryId = resolvedParams.id

    // Get inventory item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    if (!item.manufacturer || !item.model) {
      return NextResponse.json(
        { error: 'Manufacturer and model are required to fetch resources' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const searchQuery = `${item.manufacturer} ${item.model} ${item.name}`

    // Fetch image from Google Custom Search API first
    let imageUrl = await fetchImageFromGoogle(item.manufacturer, item.model, item.name)

    // If Google search didn't return an image, try using Unsplash API as fallback
    if (!imageUrl) {
      try {
        const unsplashQuery = `${item.manufacturer} ${item.model} product`
        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(unsplashQuery)}&per_page=1&client_id=${process.env.UNSPLASH_ACCESS_KEY || ''}`
        
        if (process.env.UNSPLASH_ACCESS_KEY) {
          const unsplashResponse = await fetch(unsplashUrl)
          if (unsplashResponse.ok) {
            const unsplashData = await unsplashResponse.json()
            if (unsplashData.results && unsplashData.results.length > 0) {
              imageUrl = unsplashData.results[0].urls.regular
              console.log('Found image from Unsplash:', imageUrl)
            }
          }
        }
      } catch (error) {
        console.error('Unsplash API error:', error)
      }
    }

    // If still no image, try AI to find manufacturer website image
    if (!imageUrl && process.env.OPENAI_API_KEY) {
      try {
        const openai = getOpenAI()
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that finds product image URLs. Given a product name, manufacturer, and model, return a JSON object with:
- imageUrl: A direct URL to a product image. The URL MUST:
  1. End with .jpg, .jpeg, .png, .gif, or .webp
  2. Be a direct link to an image file (not an HTML page)
  3. Be from a reputable source (manufacturer website, Amazon, B&H Photo, etc.)
  
Examples of good URLs:
- https://example.com/product.jpg
- https://cdn.example.com/images/product.png
- https://images.example.com/product.webp

Examples of BAD URLs (do not return these):
- https://example.com/product (HTML page)
- https://example.com/product/page (HTML page)

If you cannot find a direct image URL, return null for imageUrl.`,
            },
            {
              role: 'user',
              content: `Find a DIRECT product image URL (must end with .jpg, .jpeg, .png, .gif, or .webp) for:

Manufacturer: ${item.manufacturer}
Model: ${item.model}
Product Name: ${item.name}

Search for the manufacturer's official website or reputable retailers like Amazon, B&H Photo, Sweetwater, etc. Return ONLY direct image URLs that end with image file extensions.`,
            },
          ],
          response_format: { type: 'json_object' },
        })

        const responseContent = completion.choices[0]?.message?.content
        if (responseContent) {
          const parsed = JSON.parse(responseContent)
          const aiImageUrl = parsed.imageUrl
          
          // Validate the AI-suggested URL
          if (aiImageUrl && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(aiImageUrl)) {
            if (await validateImageUrl(aiImageUrl)) {
              imageUrl = aiImageUrl
              console.log('Found valid image URL from AI:', imageUrl)
            } else {
              console.log('AI suggested URL failed validation:', aiImageUrl)
            }
          } else if (aiImageUrl) {
            console.log('AI suggested URL is not a direct image URL:', aiImageUrl)
          }
        }
      } catch (error) {
        console.error('AI image search error:', error)
      }
    }

    // Use AI to find documentation links
    let documentationLinks: Array<{ url: string; title: string; type: string }> = []
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = getOpenAI()
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that finds product documentation URLs. Given a product name, manufacturer, and model, return a JSON object with:
- documentationLinks: An array of objects, each with:
  - url: Direct link to documentation (prefer direct PDF file URLs ending in .pdf)
  - title: Descriptive title (e.g., "User Manual", "Product Specifications", "Technical Datasheet")
  - type: One of 'manual', 'spec', 'datasheet', 'support', 'guide'

CRITICAL RULES:
1. PREFER direct PDF file URLs (ending in .pdf) over webpage links
2. NEVER return chrome-extension:// URLs or browser extension URLs
3. URLs must be valid HTTP/HTTPS web addresses (no file://, chrome-extension://, or other protocols)
4. Focus on finding actual PDF documentation files hosted on manufacturer websites or official repositories
5. Return direct download links to PDF files when available
6. Only return URLs that are likely to still exist and be accessible

Search for official manufacturer documentation PDFs, product manuals, specifications sheets, and technical datasheets. Return direct PDF file URLs when possible. If you cannot find specific URLs, return an empty array.`,
            },
            {
              role: 'user',
              content: `Find documentation links for: ${searchQuery}

Manufacturer: ${item.manufacturer}
Model: ${item.model}
Product Name: ${item.name}

Provide direct PDF file URLs to official documentation. Prefer PDF files ending in .pdf hosted on manufacturer websites. Examples:
- Good: https://www.manufacturer.com/resource-files/product-manual.pdf
- Good: https://www.manufacturer.com/downloads/product-specs.pdf
- Good: https://www.manufacturer.com/support/files/user-guide.pdf
- Bad: chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://...
- Bad: file:///path/to/file.pdf

Return only valid HTTP/HTTPS URLs to PDF files.`,
            },
          ],
          response_format: { type: 'json_object' },
        })

        const responseContent = completion.choices[0]?.message?.content
        if (responseContent) {
          const parsed = JSON.parse(responseContent)
          const rawLinks = parsed.documentationLinks || []
          
          // Filter out invalid URLs (chrome-extension, file://, etc.) but keep PDFs
          documentationLinks = rawLinks.filter((link: { url: string; title: string; type: string }) => {
            const url = link.url?.toLowerCase() || ''
            // Reject chrome-extension URLs
            if (url.startsWith('chrome-extension://')) return false
            // Reject file:// URLs
            if (url.startsWith('file://')) return false
            // Must be http or https
            if (!url.startsWith('http://') && !url.startsWith('https://')) return false
            return true
          })
        }
      } catch (error) {
        console.error('AI documentation search error:', error)
      }
    }

    // If we have an image URL, use the proxy to avoid CORS issues
    let finalImageUrl = imageUrl
    if (imageUrl) {
      // Use proxy for external URLs to avoid CORS issues
      finalImageUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
    }

    // Update inventory item with fetched resources
    const updated = await prisma.inventoryItem.update({
      where: { id: inventoryId },
      data: {
        imageUrl: finalImageUrl, // Store the proxy URL
        documentationLinks: documentationLinks.length > 0 ? JSON.stringify(documentationLinks) : null,
      },
    })

    return NextResponse.json({
      success: true,
      imageUrl: updated.imageUrl,
      documentationLinks: updated.documentationLinks ? JSON.parse(updated.documentationLinks) : [],
    })
  } catch (error: any) {
    console.error('Fetch resources error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

