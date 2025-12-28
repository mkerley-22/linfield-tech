import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            PageTag: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json(tags)
  } catch (error: any) {
    console.error('Get tags error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      )
    }
    
    // Check if tag already exists
    const existing = await prisma.tag.findUnique({
      where: { name },
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 400 }
      )
    }
    
    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || '#2563eb',
      },
    })
    
    return NextResponse.json(tag, { status: 201 })
  } catch (error: any) {
    console.error('Create tag error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create tag' },
      { status: 500 }
    )
  }
}

