import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        Category: true,
        Page: true,
      },
    })
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Get event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      pageId,
      isAllDay,
      isRecurring,
      recurrenceRule,
      equipment,
      updateScope,
    } = body

    // Get the current event to check if it's part of a recurring series
    const currentEvent = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!currentEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const updateData: any = {
      title: title || undefined,
      description: description !== undefined ? description : undefined,
      setupTime: setupTime !== undefined ? (setupTime ? new Date(setupTime) : null) : undefined,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      location: location !== undefined ? location : undefined,
      categoryId: categoryId !== undefined ? categoryId : undefined,
      eventType: eventType || undefined,
      schoolLevel: schoolLevel !== undefined ? schoolLevel : undefined,
      pageId: pageId !== undefined ? pageId : undefined,
      isAllDay: isAllDay !== undefined ? isAllDay : undefined,
      isRecurring: isRecurring !== undefined ? isRecurring : undefined,
      recurrenceRule: recurrenceRule !== undefined ? recurrenceRule : undefined,
      equipment: equipment !== undefined ? equipment : undefined,
    }

    // If updating "this and following events" and event is part of a recurring series
    if (updateScope === 'thisAndFollowing' && currentEvent.recurrenceRule) {
      // For following events, we should update most fields but preserve the time sequence
      // So we'll update everything except startTime, endTime, and setupTime
      const followingEventsUpdateData: any = {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        location: location !== undefined ? location : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        eventType: eventType || undefined,
        schoolLevel: schoolLevel !== undefined ? schoolLevel : undefined,
        isAllDay: isAllDay !== undefined ? isAllDay : undefined,
        equipment: equipment !== undefined ? equipment : undefined,
        // Note: We don't update startTime, endTime, or setupTime for following events
        // to preserve the recurrence pattern
      }

      // Update all events with the same recurrenceRule that start after this event
      await prisma.event.updateMany({
        where: {
          recurrenceRule: currentEvent.recurrenceRule,
          startTime: {
            gt: currentEvent.startTime, // Only events after this one (not including this one)
          },
        },
        data: followingEventsUpdateData,
      })
    }

    // Update the current event
    const event = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
      include: {
        Category: true,
        Page: true,
      },
    })
    
    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Update event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.event.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete event' },
      { status: 500 }
    )
  }
}

