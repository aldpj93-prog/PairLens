/**
 * GET /api/cron/scan — Vercel Cron Job endpoint
 * Scheduled at 14:00 UTC (11h BRT) and 18:00 UTC (15h BRT), weekdays.
 *
 * Protected by Authorization: Bearer <CRON_SECRET> header (set by Vercel).
 */

import { NextResponse } from 'next/server'
import { runPairScan } from '@/lib/scanner'

export const maxDuration = 300 // 5 minutes max execution time

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hour = new Date().getUTCHours()
  const triggerType = hour === 14 ? 'cron_11h' : 'cron_15h'

  try {
    await runPairScan(triggerType)
    return NextResponse.json({ ok: true, triggerType })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
