import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { listCalendarEvents, parseRecurrenceRule } from '@/lib/google/calendar'
import { getOrRefreshToken } from '@/lib/google/drive'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const calendarId = searchParams.get('calendarId')
    const upcoming = searchParams.get('upcoming') === 'true'
    const timeMin = searchParams.get('timeMin')
    const timeMax = searchParams.get('timeMax')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where: any = {}
    if (categoryId) {
      where.categoryId = categoryId
    }
    if (calendarId && calendarId.trim()) {
      where.sourceCalendarId = calendarId.trim()
    }
    if (upcoming) {
      const now = new Date()
      where.startTime = { gte: now }
      where.endTime = { gte: now }
    }
    if (timeMin || timeMax) {
      const min = timeMin ? new Date(timeMin) : null
      const max = timeMax ? new Date(timeMax) : null
      if (min != null) where.endTime = { ...(where.endTime as object || {}), gt: min }
      if (max != null) where.startTime = { ...(where.startTime as object || {}), lt: max }
      if (min != null && !where.endTime) where.endTime = { gt: min }
      if (max != null && !where.startTime) where.startTime = { lt: max }
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
        id: crypto.randomUUID(),
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
        updatedAt: new Date(),
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

