/**
 * POST /api/scan — trigger manual scan
 */

import { NextResponse } from 'next/server'
import { runPairScan } from '@/lib/scanner'
import { createAdminClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createSSRClient } from '@/lib/supabase'

export async function POST(request: Request) {
  // Verify auth
  //const cookieStore = cookies()
  //const supabase = createSSRClient(cookieStore)
  //const { data: { user } } = await supabase.auth.getUser()
  //if (!user) {
    //return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  //}

  // Run scan in background — don't await so the response returns immediately
  // The client polls /api/scan/status for progress
  void runPairScan('manual').catch(console.error)

  return NextResponse.json({ ok: true, message: 'Scan started' })
}
