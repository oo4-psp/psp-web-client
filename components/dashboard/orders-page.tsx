'use client'

import { DashboardLayout } from './dashboard-layout'
import { renderOrdersTab } from './views'
import { PAGE_SIZE, useOrdersData } from './use-page-data'

export default function OrdersPageClient() {
  const data = useOrdersData()
  return <DashboardLayout tab="orders" notice={data.notice} onNoticeChange={data.setNotice} onRefresh={() => void data.load(false)}>{data.loading ? <div className="center-state">Завантаження ордерів…</div> : renderOrdersTab({ user: null, wallet: null, exchangeRate: data.exchangeRate, orders: data.orders, ordersTotal: data.total, ordersPage: data.page, ordersPerPage: PAGE_SIZE, setOrdersPage: data.setPage, releaseOrder: data.releaseOrder, fixOrder: data.fixOrder } as never)}</DashboardLayout>
}
