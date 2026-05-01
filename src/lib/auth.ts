import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'

export const SESSION_COOKIE = 'admin_session'
const EXPIRY_SECONDS = 7 * 24 * 60 * 60

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const hashBuf = Buffer.from(hash, 'hex')
    const derived = scryptSync(password, salt, 64)
    if (hashBuf.length !== derived.length) return false
    return timingSafeEqual(hashBuf, derived)
  } catch {
    return false
  }
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function signToken(email: string): string {
  const secret = process.env.JWT_SECRET!
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + EXPIRY_SECONDS,
      })
    )
  )
  const data = `${header}.${payload}`
  const sig = b64url(createHmac('sha256', secret).update(data).digest())
  return `${data}.${sig}`
}

export function verifyToken(token: string): { email: string } | null {
  try {
    const secret = process.env.JWT_SECRET!
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, payload, sig] = parts
    const data = `${header}.${payload}`
    const expectedSig = b64url(createHmac('sha256', secret).update(data).digest())
    const sigBuf = Buffer.from(sig)
    const expectedBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expectedBuf.length) return null
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null
    const parsed = JSON.parse(Buffer.from(payload, 'base64').toString())
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null
    return { email: parsed.email as string }
  } catch {
    return null
  }
}
