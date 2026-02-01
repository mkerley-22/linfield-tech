import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/prisma-retry'
import { sendDueDateReminderEmail } from '@/lib/email'

type ItemEntry = { inventoryId: string; quantity: number; fromDate: string; toDate: string }

/**
 * Cron: send due-date reminder emails to requesters whose equipment is due back tomorrow.
 * Call daily (e.g. once per day in the morning). Secured with CRON_SECRET.
 *
 * Vercel: add to vercel.json crons and set CRON_SECRET in env.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Tomorrow in YYYY-MM-DD (UTC)
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const tomorrowStr = tomorrow.toISOString().slice(0, 10)

    const requests = await withRetry(() =>
      prisma.checkoutRequest.findMany({
        where: { status: { not: 'denied' } },
        select: {
          id: true,
          requesterEmail: true,
          requesterName: true,
          items: true,
        },
      })
    )

    const toRemind: Array<{
      id: string
      requesterEmail: string
      requesterName: string
      dueDate: string
      itemNames: string[]
    }> = []

    for (const req of requests) {
      let items: ItemEntry[]
      try {
        items = JSON.parse(req.items) as ItemEntry[]
      } catch {
        continue
      }
      if (items.length === 0) continue
      const maxTo = items.reduce((max, i) => (i.toDate > max ? i.toDate : max), items[0].toDate)
      if (maxTo !== tomorrowStr) continue

      const inventoryIds = [...new Set(items.map((i) => i.inventoryId))]
      const inventory = await withRetry(() =>
        prisma.inventoryItem.findMany({
          where: { id: { in: inventoryIds } },
          select: { id: true, name: true },
        })
      )
      const nameById = new Map(inventory.map((i) => [i.id, i.name]))
      const itemNames = items.map((i) => nameById.get(i.inventoryId) || 'Item')

      toRemind.push({
        id: req.id,
        requesterEmail: req.requesterEmail,
        requesterName: req.requesterName,
        dueDate: tomorrowStr,
        itemNames,
      })
    }

    let sent = 0
    for (const r of toRemind) {
      const ok = await sendDueDateReminderEmail(
        r.requesterEmail,
        r.requesterName,
        r.dueDate,
        r.itemNames,
        r.id
      )
      if (ok) sent++
    }

    return NextResponse.json({
      ok: true,
      tomorrow: tomorrowStr,
      remindersQueued: toRemind.length,
      emailsSent: sent,
    })
  } catch (error: unknown) {
    console.error('[Cron] due-date-reminders error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron failed' },
      { status: 500 }
    )
  }
}
