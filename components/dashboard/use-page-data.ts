'use client'

import { useCallback, useEffect, useState } from 'react'
import { request } from '@/lib/api'
import type { Credential, Dispute, ExchangeRate, Order, UserInfo } from '@/lib/domain'

const PAGE_SIZE = 10

type ListState = { page: number; total: number }

function usePagedResource<T>(loadResource: (page: number) => Promise<{ items: T[]; total: number }>) {
  const [items, setItems] = useState<T[]>([])
  const [state, setState] = useState<ListState>({ page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const result = await loadResource(state.page)
      setItems(result.items)
      setState((current) => ({ ...current, total: result.total }))
    } finally {
      setLoading(false)
    }
  }, [loadResource, state.page])

  useEffect(() => { void load() }, [load])
  const setPage = (page: number) => setState((current) => ({ ...current, page }))
  const mutate = async (action: () => Promise<void>, message: string) => {
    try { await action(); setNotice(message); await load(false) }
    catch { setNotice('Операцію не вдалося виконати') }
  }

  return { items, page: state.page, total: state.total, loading, notice, setNotice, setPage, load, mutate }
}

function totalOf(data: { total?: number; count?: number }) { return data.total ?? data.count ?? 0 }

export function useOrdersData() {
  const [data, setData] = useState<{ orders: Order[]; total: number; page: number }>({ orders: [], total: 0, page: 1 })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const load = useCallback(async (showLoading = true) => { if (showLoading) setLoading(true); try { const [orders, rate] = await Promise.all([request<{ orders?: Order[]; total?: number; count?: number }>(`/api/orders?limit=${PAGE_SIZE}&page=${data.page}`), request<{ data: ExchangeRate }>('/api/wallet/exchange-rate/UAH')]); setData((current) => ({ ...current, orders: orders.orders ?? [], total: totalOf(orders), rate: rate.data } as typeof current & { rate: ExchangeRate })) } finally { setLoading(false) } }, [data.page])
  useEffect(() => { void load() }, [load])
  const mutate = async (action: () => Promise<void>, message: string) => { try { await action(); setNotice(message); await load(false) } catch { setNotice('Операцію не вдалося виконати') } }
  return { ...data, exchangeRate: (data as typeof data & { rate?: ExchangeRate }).rate ?? null, loading, notice, setNotice, setPage: (page: number) => setData((current) => ({ ...current, page })), load, releaseOrder: (id: string, amount?: string, currency?: string) => mutate(() => request('/api/orders/release', { method: 'POST', body: JSON.stringify({ id, new_amount: amount ?? null, currency }) }).then(() => undefined), 'Ордер підтверджено'), fixOrder: (id: string, amount?: string, currency?: string) => mutate(() => request('/api/appeals/fix', { method: 'POST', body: JSON.stringify({ order_id: id, new_amount: amount ?? null, currency }) }).then(() => undefined), 'Ордер пофікшено') }
}

export function useCredentialsData() { const resource = usePagedResource<Credential>(async (page) => { const data = await request<{ requisits?: Credential[]; credentials?: Credential[]; total?: number; count?: number }>(`/api/credentials?limit=${PAGE_SIZE}&page=${page}`); return { items: data.requisits ?? data.credentials ?? [], total: totalOf(data) } }); return { ...resource, credentials: resource.items, toggleCredential: (item: Credential) => resource.mutate(() => request('/api/credentials', { method: 'PATCH', body: JSON.stringify({ user_requisit_id: item.id, enabled: !item.is_active }) }).then(() => undefined), 'Стан реквізиту змінено'), deleteCredential: (item: Credential) => resource.mutate(() => request('/api/credentials', { method: 'DELETE', body: JSON.stringify({ cred_id: item.id }) }).then(() => undefined), 'Реквізит видалено') } }

export function useDisputesData() { const resource = usePagedResource<Dispute>(async (page) => { const data = await request<{ appeals?: Dispute[]; total?: number; count?: number }>(`/api/appeals?limit=${PAGE_SIZE}&page=${page}`); return { items: data.appeals ?? [], total: totalOf(data) } }); return { ...resource, appeals: resource.items } }
export function useUsersData() { const resource = usePagedResource<UserInfo>(async (page) => { const data = await request<{ users?: UserInfo[]; total?: number; count?: number }>(`/api/users?limit=${PAGE_SIZE}&page=${page}`); return { items: data.users ?? [], total: totalOf(data) } }); return { ...resource, users: resource.items } }
export { PAGE_SIZE }
