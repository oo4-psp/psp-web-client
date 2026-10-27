'use client'
import { DashboardLayout } from './dashboard-layout'
import { renderUserDisputesTab, renderAdminUsersTab } from './views'
export function DisputesPageClient() { return <DashboardLayout tab="disputes">{(data) => renderUserDisputesTab({ appeals: data.appeals, page: data.pages.appeals, total: data.totals.appeals, pageSize: 10, onPageChange: (page: number) => data.setPage('appeals', page) } as any)}</DashboardLayout> }
export function UsersPageClient() { return <DashboardLayout tab="admin-users">{(data) => renderAdminUsersTab({ users: data.users, adminUsersPage: data.pages.users, adminUsersTotal: data.totals.users, usersPerPage: 10, onPageChange: (page: number) => data.setPage('users', page) } as any)}</DashboardLayout> }
