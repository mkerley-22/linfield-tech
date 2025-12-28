import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const relatedPages = await prisma.relatedPage.findMany({
      where: { fromPageId: params.id },
      include: {
        ToPage: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter to only include published pages
    const filtered = relatedPages.filter((rp) => rp.ToPage.isPublished)

    return NextResponse.json(filtered)
  } catch (error: any) {
    console.error('Get related pages error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch related pages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { toPageId } = body

    if (!toPageId) {
      return NextResponse.json({ error: 'toPageId is required' }, { status: 400 })
    }

    if (params.id === toPageId) {
      return NextResponse.json({ error: 'Cannot relate a page to itself' }, { status: 400 })
    }

    // Check if relation already exists
    const existing = await prisma.relatedPage.findUnique({
      where: {
        fromPageId_toPageId: {
          fromPageId: params.id,
          toPageId: toPageId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'This page is already related' }, { status: 400 })
    }

    const relatedPage = await prisma.relatedPage.create({
      data: {
        fromPageId: params.id,
        toPageId: toPageId,
      },
      include: {
        ToPage: true,
      },
    })

    return NextResponse.json(relatedPage)
  } catch (error: any) {
    console.error('Create related page error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create related page' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const toPageId = searchParams.get('toPageId')

    if (!toPageId) {
      return NextResponse.json({ error: 'toPageId is required' }, { status: 400 })
    }

    await prisma.relatedPage.delete({
      where: {
        fromPageId_toPageId: {
          fromPageId: params.id,
          toPageId: toPageId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete related page error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete related page' },
      { status: 500 }
    )
  }
}

