import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 'http://localhost:5173'

export function middleware(req: NextRequest) {
  // Only handle preflight for our API routes under /pages/api or /api
  const pathname = req.nextUrl.pathname
  if (req.method === 'OPTIONS' && (pathname.startsWith('/pages/api') || pathname.startsWith('/api'))) {
    const origin = req.headers.get('origin') || ALLOWED_ORIGIN
    const res = new NextResponse(null, { status: 200 })
    // allow the specific origin to support cookies/credentials
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Vary', 'Origin')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    return res
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/pages/api/:path*', '/api/:path*'],
}
