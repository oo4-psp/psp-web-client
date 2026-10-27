'use client'

import { useCallback, useEffect, useState } from 'react'
import { request } from '@/lib/api'
import type { Credential, Dispute, ExchangeRate, Order, User, UserInfo, Wallet } from '@/lib/domain'

export type DashboardTab = 'orders' | 'credentials' | 'disputes' | 'admin-users'

export function useDashboardData(tab: DashboardTab) {
  const [user, setUser] = useState<User | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [appeals, setAppeals] = useState<Dispute[]>([])
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [totals, setTotals] = useState({ orders: 0, credentials: 0, appeals: 0, users: 0 })
  const [pages, setPages] = useState({ orders: 1, credentials: 1, appeals: 1, users: 1 })

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const [me, orderData, credentialData, exchangeRateData] = await Promise.all([
        request<{ user: User; wallet: Wallet }>('/api/auth/me', { method: 'POST' }),
        request<any>(`/api/orders?limit=10&page=${pages.orders}`),
        request<any>(`/api/credentials?limit=10&page=${pages.credentials}`),
        request<any>('/api/wallet/exchange-rate/UAH'),
      ])
      setUser(me.user); setWallet(me.wallet); setExchangeRate(exchangeRateData.data)
      setOrders(orderData.orders ?? []); setCredentials(credentialData.requisits ?? credentialData.credentials ?? [])
      setTotals((current) => ({ ...current, orders: orderData.total ?? orderData.count ?? 0, credentials: credentialData.total ?? credentialData.count ?? 0 }))
      const appealsData = await request<any>(`/api/appeals?limit=10&page=${pages.appeals}`)
      setAppeals(appealsData.appeals ?? []); setTotals((current) => ({ ...current, appeals: appealsData.total ?? appealsData.count ?? 0 }))
      if (tab === 'admin-users') {
        const usersData = await request<any>(`/api/users?limit=10&page=${pages.users}`)
        setUsers(usersData.users ?? []); setTotals((current) => ({ ...current, users: usersData.total ?? usersData.count ?? 0 }))
      }
    } catch { setUser(null) } finally { setLoading(false) }
  }, [pages, tab])

  useEffect(() => { void load() }, [load])

  const mutate = useCallback(async (path: string, options: RequestInit, message: string) => {
    try { await request(path, options); setNotice(message); await load(false) }
    catch { setNotice('Операцію не вдалося виконати') }
  }, [load])

  const setPage = (key: keyof typeof pages, value: number) => setPages((current) => ({ ...current, [key]: value }))
  const releaseOrder = async (id: string) => mutate('/api/orders/release', { method: 'POST', body: JSON.stringify({ id, new_amount: null }) }, 'Ордер підтверджено')
  const fixOrder = async (id: string) => mutate('/api/appeals/fix', { method: 'POST', body: JSON.stringify({ order_id: id, new_amount: null }) }, 'Ордер пофікшено')
  const toggleCredential = async (item: Credential) => mutate('/api/credentials', { method: 'PATCH', body: JSON.stringify({ user_requisit_id: item.id, enabled: !item.is_active }) }, 'Стан реквізиту змінено')
  const deleteCredential = async (item: Credential) => mutate('/api/credentials', { method: 'DELETE', body: JSON.stringify({ cred_id: item.id }) }, 'Реквізит видалено')

  return { user, setUser, wallet, exchangeRate, orders, credentials, appeals, users, loading, notice, setNotice, totals, pages, setPage, load, releaseOrder, fixOrder, toggleCredential, deleteCredential }
}
