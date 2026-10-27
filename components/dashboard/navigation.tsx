'use client'

import Link from 'next/link'
import { CreditCard, LayoutDashboard, LogOut, Scale, ShieldCheck, Users } from 'lucide-react'
import type { User } from '@/lib/domain'

type DashboardTab = 'orders' | 'credentials' | 'disputes' | 'admin-users'

type Props = {
  user: User
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  onLogout: () => void
}

const navigation = [
  { id: 'orders', label: 'Ордера', icon: LayoutDashboard },
  { id: 'credentials', label: 'Реквізити', icon: CreditCard },
  { id: 'disputes', label: 'Диспути', icon: Scale },
] as const

export function DashboardSidebar({ user, activeTab, onTabChange, onLogout }: Props) {
  const canManageUsers = user.role === 'ADMIN' || user.role === 'SUPPORT'

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><ShieldCheck size={21} /></div>
        <span>trade<span className="brand-accent">desk</span></span>
      </div>
      <nav aria-label="Основна навігація">
        {navigation.map(({ id, label, icon: Icon }) => (
          <Link key={id} href={`/${id}`} className={activeTab === id ? 'nav-item active' : 'nav-item'} onClick={() => onTabChange(id)}>
            <Icon size={18} />{label}
          </Link>
        ))}
        {canManageUsers && (
          <Link href="/users" className={activeTab === 'admin-users' ? 'nav-item active' : 'nav-item'} onClick={() => onTabChange('admin-users')}>
            <Users size={18} />Користувачі
          </Link>
        )}
      </nav>
      <div className="sidebar-bottom">
        <div className="profile">
          <div className="avatar">{user.login.slice(0, 1).toUpperCase()}</div>
          <div><strong>{user.login}</strong><small>{user.role}</small></div>
        </div>
        <button className="logout" onClick={onLogout} aria-label="Вийти"><LogOut size={17} /></button>
      </div>
    </aside>
  )
}

const pageTitles: Record<DashboardTab, string> = {
  orders: 'Ордера',
  credentials: 'Платіжні реквізити',
  disputes: 'Диспути',
  'admin-users': 'Користувачі',
}

export function DashboardHeader({ activeTab, onRefresh }: { activeTab: DashboardTab; onRefresh: () => void }) {
  return (
    <header className="topbar">
      <div><p className="eyebrow">КАБІНЕТ ТРЕЙДЕРА</p><h1>{pageTitles[activeTab]}</h1></div>
      <button className="refresh" onClick={onRefresh} aria-label="Оновити">Оновити</button>
    </header>
  )
}
