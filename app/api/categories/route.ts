import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color, icon } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if category with this name already exists
    const existing = await prisma.category.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        name,
        slug: slugify(name),
        description: description || null,
        color: color || '#2563eb',
        icon: icon || null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Create category error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        Page: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error: any) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

