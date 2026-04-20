// middleware.ts (at the root of your project)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('access-token')?.value;
  const refreshToken = req.cookies.get('refresh-token')?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/scanner/:path*'], // routes to protect
};