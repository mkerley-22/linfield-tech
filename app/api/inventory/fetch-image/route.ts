import { NextRequest, NextResponse } from 'next/server'

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    const contentType = response.headers.get('content-type')
    return response.ok && contentType?.startsWith('image/') === true
  } catch {
    return false
  }
}

// Fetch image from Google Custom Search API
async function fetchImageFromGoogle(manufacturer: string, model: string, productName?: string): Promise<string | null> {
  const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID

  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    return null
  }

  try {
    const searchQuery = productName 
      ? `${manufacturer} ${model} ${productName} product image`
      : `${manufacturer} ${model} product image`
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
    console.error('Google Custom Search API error:', error)
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { manufacturer, model, productName } = body

    if (!manufacturer || !model) {
      return NextResponse.json(
        { error: 'Manufacturer and model are required' },
        { status: 400 }
      )
    }

    let imageUrl: string | null = null

    // Try Unsplash first (no special setup needed, just API key)
    try {
      const unsplashQuery = `${manufacturer} ${model} product`
      const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(unsplashQuery)}&per_page=5&client_id=${process.env.UNSPLASH_ACCESS_KEY || ''}`
      
      if (process.env.UNSPLASH_ACCESS_KEY) {
        const unsplashResponse = await fetch(unsplashUrl)
        if (unsplashResponse.ok) {
          const unsplashData = await unsplashResponse.json()
          if (unsplashData.results && unsplashData.results.length > 0) {
            // Try to find the best match (prefer images with product-related keywords)
            const bestMatch = unsplashData.results.find((img: any) => 
              img.description?.toLowerCase().includes(manufacturer.toLowerCase()) ||
              img.description?.toLowerCase().includes(model.toLowerCase()) ||
              img.alt_description?.toLowerCase().includes(manufacturer.toLowerCase())
            ) || unsplashData.results[0]
            
            imageUrl = bestMatch.urls.regular
            console.log('Found image from Unsplash:', imageUrl)
          }
        }
      }
    } catch (error) {
      console.error('Unsplash API error:', error)
    }

    // If Unsplash didn't return an image, try Google Custom Search API as fallback
    if (!imageUrl) {
      imageUrl = await fetchImageFromGoogle(manufacturer, model, productName)
    }

    return NextResponse.json({ 
      imageUrl: imageUrl || null,
      success: !!imageUrl
    })
  } catch (error: any) {
    console.error('Fetch image error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch image' },
      { status: 500 }
    )
  }
}

