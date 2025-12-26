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

    const section = await prisma.section.create({
      data: {
        name,
        slug: slugify(name),
        description: description || null,
        color: color || '#2563eb',
        icon: icon || null,
      },
    })

    return NextResponse.json(section)
  } catch (error: any) {
    console.error('Create section error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create section' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const sections = await prisma.section.findMany({
      include: {
        pages: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(sections)
  } catch (error: any) {
    console.error('Get sections error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

