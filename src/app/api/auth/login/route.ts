import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, signToken, SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string; password?: string }
  const { email, password } = body

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

  if (
    !email ||
    !password ||
    !adminEmail ||
    !adminPasswordHash ||
    email !== adminEmail ||
    !verifyPassword(password, adminPasswordHash)
  ) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = signToken(email)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
  return res
}
