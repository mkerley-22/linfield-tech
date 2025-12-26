import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: params.slug },
      include: {
        children: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
        attachments: true,
        tags: {
          include: {
            tag: true,
          },
        },
        parent: {
          include: {
            parent: true,
          },
        },
      },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('Get page by slug error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch page' },
      { status: 500 }
    )
  }
}

