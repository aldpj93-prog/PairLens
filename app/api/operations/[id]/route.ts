import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSSRClient, createAdminClient } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  //const cookieStore = cookies()
  //const supabase = createSSRClient(cookieStore)
  //const { data: { user } } = await supabase.auth.getUser()
  //if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { exit_price_a, exit_price_b } = body
  const db = createAdminClient()

  // Fetch the operation to compute P&L
  const { data: op } = await db
    .from('operations')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!op) return NextResponse.json({ error: 'Operation not found' }, { status: 404 })

  const exit_ratio = exit_price_b > 0 ? exit_price_a / exit_price_b : null
  let pnl_pct: number | null = null

  if (exit_ratio != null && op.entry_ratio > 0) {
    if (op.signal === 'long_spread') {
      pnl_pct = (exit_ratio - op.entry_ratio) / op.entry_ratio * 100
    } else {
      pnl_pct = (op.entry_ratio - exit_ratio) / op.entry_ratio * 100
    }
    pnl_pct = Math.round(pnl_pct * 10000) / 10000
  }

  const { error } = await db
    .from('operations')
    .update({
      exit_price_a,
      exit_price_b,
      exit_ratio: exit_ratio != null ? Math.round(exit_ratio * 1000000) / 1000000 : null,
      exit_at: new Date().toISOString(),
      pnl_pct,
      status: 'closed',
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, pnl_pct })
}
