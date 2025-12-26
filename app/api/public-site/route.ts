import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser, isEditor } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get public site settings (no auth required for public access)
    let settings = await prisma.publicSiteSettings.findUnique({
      where: { id: 'default' },
    })

    // If settings don't exist, create default
    if (!settings) {
      settings = await prisma.publicSiteSettings.create({
        data: {
          id: 'default',
          siteTitle: 'Help Center',
          siteDescription: 'Find answers to common questions',
          enabled: false,
          searchEnabled: true,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Get public site settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch public site settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canEdit = await isEditor()
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { siteTitle, siteDescription, homepagePageId, enabled, searchEnabled, navigationJson, themeJson } = body

    const settings = await prisma.publicSiteSettings.upsert({
      where: { id: 'default' },
      update: {
        siteTitle: siteTitle !== undefined ? siteTitle : undefined,
        siteDescription: siteDescription !== undefined ? siteDescription : undefined,
        homepagePageId: homepagePageId !== undefined ? homepagePageId : undefined,
        enabled: enabled !== undefined ? enabled : undefined,
        searchEnabled: searchEnabled !== undefined ? searchEnabled : undefined,
        navigationJson: navigationJson !== undefined ? navigationJson : undefined,
        themeJson: themeJson !== undefined ? themeJson : undefined,
      },
      create: {
        id: 'default',
        siteTitle: siteTitle || 'Help Center',
        siteDescription: siteDescription || 'Find answers to common questions',
        homepagePageId: homepagePageId || null,
        enabled: enabled !== undefined ? enabled : false,
        searchEnabled: searchEnabled !== undefined ? searchEnabled : true,
        navigationJson: navigationJson || null,
        themeJson: themeJson || null,
      },
    })

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Update public site settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update public site settings' },
      { status: 500 }
    )
  }
}

