import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, SESSION_COOKIE } from '@/lib/auth'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

const BACKEND = 'http://127.0.0.1:3000'
const PUBLIC_PATHS = ['/login', '/api/auth']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/admin') || pathname.startsWith('/content/')) {
    const url = `${BACKEND}${pathname}${req.nextUrl.search}`
    const headers = new Headers(req.headers)
    headers.delete('host')

    const isBody = req.method !== 'GET' && req.method !== 'HEAD'
    const body = isBody ? await req.arrayBuffer() : undefined

    try {
      const res = await fetch(url, { method: req.method, headers, body })
      return new NextResponse(res.body, { status: res.status, headers: res.headers })
    } catch {
      return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 })
    }
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
