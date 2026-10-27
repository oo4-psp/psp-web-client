'use client'

import { DashboardLayout } from './dashboard-layout'
import { renderAdminUsersTab, renderUserDisputesTab } from './views'
import { PAGE_SIZE, useDisputesData, useUsersData } from './use-page-data'

export function DisputesPageClient() {
  const data = useDisputesData()
  return <DashboardLayout tab="disputes" notice={data.notice} onNoticeChange={data.setNotice} onRefresh={() => void data.load(false)}>{data.loading ? <div className="center-state">Завантаження спорів…</div> : renderUserDisputesTab({ appeals: data.appeals, page: data.page, total: data.total, pageSize: PAGE_SIZE, onPageChange: data.setPage })}</DashboardLayout>
}

export function UsersPageClient() {
  const data = useUsersData()
  return <DashboardLayout tab="admin-users" notice={data.notice} onNoticeChange={data.setNotice} onRefresh={() => void data.load(false)}>{data.loading ? <div className="center-state">Завантаження користувачів…</div> : renderAdminUsersTab({ users: data.users, adminUsersPage: data.page, adminUsersTotal: data.total, usersPerPage: PAGE_SIZE, onPageChange: data.setPage })}</DashboardLayout>
}
