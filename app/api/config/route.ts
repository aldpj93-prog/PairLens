/**
 * GET  /api/config — read all config keys
 * POST /api/config — update config keys
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSSRClient, createAdminClient } from '@/lib/supabase'

export async function GET() {
  //const cookieStore = cookies()
  //const supabase = createSSRClient(cookieStore)
  //const { data: { user } } = await supabase.auth.getUser()
  //if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data } = await db.from('config').select('key, value, updated_at')
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  //const cookieStore = cookies()
  //const supabase = createSSRClient(cookieStore)
  //const { data: { user } } = await supabase.auth.getUser()
  //if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (typeof body !== 'object' || !body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const db = createAdminClient()
  const now = new Date().toISOString()
  const upserts = Object.entries(body as Record<string, string>).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: now,
  }))

  const { error } = await db.from('config').upsert(upserts, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
