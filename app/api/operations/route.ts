import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSSRClient, createAdminClient } from '@/lib/supabase'

export async function GET() {
  const db = createAdminClient()
  const { data } = await db
    .from('operations')
    .select('*')
    .order('entry_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  //const cookieStore = cookies()
  //const supabase = createSSRClient(cookieStore)
  //const { data: { user } } = await supabase.auth.getUser()
  //if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const db = createAdminClient()

  const {
    ticker_a, ticker_b, signal, hedge_ratio,
    entry_ratio, target_ratio, stop_ratio,
    entry_price_a, entry_price_b, entry_qty_a, entry_qty_b,
    pair_id,
  } = body

  const { data, error } = await db
    .from('operations')
    .insert({
      ticker_a, ticker_b, signal, hedge_ratio,
      entry_ratio, target_ratio, stop_ratio,
      entry_price_a, entry_price_b, entry_qty_a, entry_qty_b,
      pair_id: pair_id ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
