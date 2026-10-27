'use client'
import { DashboardLayout } from './dashboard-layout'
import { renderOrdersTab } from './views'
export default function OrdersPageClient() { return <DashboardLayout tab="orders">{(data) => renderOrdersTab({ user: data.user, wallet: data.wallet, exchangeRate: data.exchangeRate, orders: data.orders, ordersTotal: data.totals.orders, ordersPage: data.pages.orders, ordersPerPage: 10, setOrdersPage: (page: number) => data.setPage('orders', page), releaseOrder: data.releaseOrder, fixOrder: data.fixOrder } as any)}</DashboardLayout> }
