import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, SESSION_COOKIE } from '@/lib/auth'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

const BACKEND = 'http://127.0.0.1:3000'
const PUBLIC_PATHS = ['/login', '/api/auth']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/admin')) {
    const backendUrl = new URL(pathname + req.nextUrl.search, BACKEND)
    return NextResponse.rewrite(backendUrl)
  }

  if (pathname.startsWith('/content/')) {
    const backendUrl = new URL(pathname + req.nextUrl.search, BACKEND)
    return NextResponse.rewrite(backendUrl)
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token || !verifyToken(token)) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
