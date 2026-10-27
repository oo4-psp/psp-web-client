'use client'

import { useCallback, useEffect, useState } from 'react'
import { request } from '@/lib/api'
import type { User, Wallet } from '@/lib/domain'

export function useDashboardSession() {
  const [user, setUser] = useState<User | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await request<{ user: User; wallet: Wallet }>('/api/auth/me', { method: 'POST' })
      setUser(response.user)
      setWallet(response.wallet)
    } catch {
      setUser(null)
      setWallet(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { user, setUser, wallet, loading, reload: load }
}
