import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { listCalendarEvents, parseRecurrenceRule } from '@/lib/google/calendar'
import { getOrRefreshToken } from '@/lib/google/drive'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where: any = {}
    if (categoryId) {
      where.categoryId = categoryId
    }
    if (upcoming) {
      where.startTime = { gte: new Date() }
    }
    
    const events = await prisma.event.findMany({
      where,
      include: {
        Category: true,
        Page: true,
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    })
    
    return NextResponse.json({ events })
  } catch (error: any) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      setupTime,
      startTime, 
      endTime, 
      location, 
      categoryId, 
      eventType,
      schoolLevel,
      isAllDay,
      isRecurring,
      recurrenceRule,
      equipment,
      calendarId,
      calendarName 
    } = body
    
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'title, startTime, and endTime are required' },
        { status: 400 }
      )
    }
    
    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        setupTime: setupTime ? new Date(setupTime) : null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        categoryId: categoryId || null,
        eventType: eventType || 'meeting',
        schoolLevel: schoolLevel || null,
        isAllDay: isAllDay || false,
        isRecurring: isRecurring || false,
        recurrenceRule: recurrenceRule || null,
        equipment: equipment || null,
        calendarId: calendarId || null,
        calendarName: calendarName || null,
      },
      include: {
        Category: true,
      },
    })
    
    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    )
  }
}

