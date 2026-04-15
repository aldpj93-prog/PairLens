/**
 * GET /api/history?tickers=VALE3,ITUB4
 * Busca histórico de preços server-side (Yahoo Finance) e retorna ao cliente.
 * Necessário porque Yahoo Finance bloqueia CORS em requisições do browser.
 */

import { NextResponse } from 'next/server'
import { fetchHistory, alignPriceSeries } from '@/lib/brapi'
import { testCointegration, computeZScoreSeries } from '@/lib/stats'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tickersParam = searchParams.get('tickers') ?? ''
  const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)

  if (tickers.length < 2) {
    return NextResponse.json({ error: 'Provide at least 2 tickers' }, { status: 400 })
  }

  const [ha, hb] = await Promise.all([fetchHistory(tickers[0]), fetchHistory(tickers[1])])
  if (!ha || !hb) {
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 502 })
  }

  const { datesA: dates, pricesA, pricesB } = alignPriceSeries(ha, hb)
  const result  = testCointegration(pricesA, pricesB)
  const zScores = computeZScoreSeries(result.residuals, 60)

  return NextResponse.json({
    dates,
    pricesA,
    pricesB,
    residuals: result.residuals,
    zScores,
  })
}
