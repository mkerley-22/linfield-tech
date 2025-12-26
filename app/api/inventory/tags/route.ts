import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Predefined tags
const PREDEFINED_TAGS = [
  { name: 'lighting', color: '#fbbf24' },
  { name: 'audio', color: '#3b82f6' },
  { name: 'video', color: '#ef4444' },
  { name: 'high school', color: '#8b5cf6' },
  { name: 'middle school', color: '#ec4899' },
  { name: 'elementary school', color: '#10b981' },
  { name: 'global', color: '#6366f1' },
]

export async function GET() {
  try {
    // Ensure predefined tags exist
    for (const tag of PREDEFINED_TAGS) {
      await prisma.inventoryTag.upsert({
        where: { name: tag.name },
        create: tag,
        update: {},
      })
    }
    
    const tags = await prisma.inventoryTag.findMany({
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json({ tags })
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
    
    const tag = await prisma.inventoryTag.create({
      data: {
        name,
        color: color || '#2563eb',
      },
    })
    
    return NextResponse.json({ tag }, { status: 201 })
  } catch (error: any) {
    console.error('Create tag error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create tag' },
      { status: 500 }
    )
  }
}

