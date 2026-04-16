import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {

}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
