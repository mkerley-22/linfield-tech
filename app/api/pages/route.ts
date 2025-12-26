import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, description, content, parentId, categoryId, isPublished } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const page = await prisma.page.create({
      data: {
        id: crypto.randomUUID(),
        title,
        slug: slug || slugify(title),
        description: description || null,
        content: content || '',
        parentId: parentId || null,
        categoryId: categoryId || null,
        isPublished: isPublished !== undefined ? isPublished : true,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('Create page error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create page' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const parentId = searchParams.get('parentId')

    const pages = await prisma.page.findMany({
      where: {
        parentId: parentId || null,
        isPublished: true,
      },
      include: {
        other_Page: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
        Attachment: true,
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(pages)
  } catch (error: any) {
    console.error('Get pages error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}

