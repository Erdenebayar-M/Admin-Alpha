'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Нэвтрэхэд алдаа гарлаа')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Сүлжээний алдаа — дахин оролдоно уу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <GraduationCap className="size-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Боловсролын Систем</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Монгол бичгийн апп · Админ самбар</p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-xl border border-border bg-card px-8 py-7 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold text-foreground">Нэвтрэх</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="email">
                И-мэйл
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
                placeholder="admin@example.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="password">
                Нууц үг
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="mt-1 w-full">
              {loading ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
