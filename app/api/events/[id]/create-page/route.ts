import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    })
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    if (event.pageId) {
      return NextResponse.json({ error: 'Event already has a page' }, { status: 400 })
    }
    
    // Create page for event
    const page = await prisma.page.create({
      data: {
        title: event.title,
        slug: slugify(event.title),
        description: event.description || `Event on ${event.startTime.toLocaleDateString()}`,
        content: `# ${event.title}\n\n${event.description || ''}\n\n**Date:** ${event.startTime.toLocaleString()}\n**Location:** ${event.location || 'TBD'}\n\n## Event Details\n\n- **Start:** ${event.startTime.toLocaleString()}\n- **End:** ${event.endTime.toLocaleString()}\n${event.location ? `- **Location:** ${event.location}` : ''}\n\n## Notes\n\n_Add event notes and documentation here._`,
        categoryId: event.categoryId,
        isPublished: true,
      },
    })
    
    // Link event to page
    await prisma.event.update({
      where: { id: params.id },
      data: { 
        pageId: page.id,
        updatedAt: new Date(),
      },
    })
    
    return NextResponse.json({ page, event: { ...event, pageId: page.id } })
  } catch (error: any) {
    console.error('Create event page error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create event page' },
      { status: 500 }
    )
  }
}

