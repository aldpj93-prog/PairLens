/**
 * GET /api/scan/status — returns current scan progress as JSON
 * Polled every 2 seconds by the scanner page banner.
 */

import { NextResponse } from 'next/server'
import { scanProgress } from '@/lib/scanner'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    running:        scanProgress.running,
    phase:          scanProgress.phase,
    tickersFetched: scanProgress.tickersFetched,
    tickersTotal:   scanProgress.tickersTotal,
    elapsedMs: scanProgress.running
      ? Date.now() - scanProgress.startedAt
      : scanProgress.elapsedMs,
    scanRunId: scanProgress.scanRunId,
  })
}
