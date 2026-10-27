'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { DashboardHeader, DashboardSidebar } from './navigation'
import { useDashboardSession } from './use-dashboard-session'

export function DashboardLayout({ tab, children, notice = '', onNoticeChange, onRefresh }: { tab: 'orders' | 'credentials' | 'disputes' | 'admin-users'; children: ReactNode; notice?: string; onNoticeChange?: (notice: string) => void; onRefresh?: () => void }) {
  const session = useDashboardSession()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); try { await fetch('/api/auth/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, password, role: 'TRADER' }) }); await session.reload() } catch { setError('Не вдалося увійти. Перевірте логін і пароль.') } }
  if (session.loading) return <main className="center-state"><RefreshCw className="spin" /><span>Завантаження кабінету…</span></main>
  if (!session.user) return <main className="login-page"><div className="login-card"><div className="brand-mark"><ShieldCheck size={24} /></div><p className="eyebrow">TRADER PORTAL</p><h1>Вхід у кабінет</h1><p className="muted">Керуйте ордерами та платіжними реквізитами в одному місці.</p><form onSubmit={submit} className="login-form"><label>Логін<input value={login} onChange={(e) => setLogin(e.target.value)} required /></label><label>Пароль<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{error && <p className="error-text">{error}</p>}<button className="primary-button" type="submit">Увійти <ArrowRight size={17} /></button></form></div></main>
  return <main className="app-shell"><DashboardSidebar user={session.user} activeTab={tab} onTabChange={() => {}} onLogout={() => session.setUser(null)} /><section className="content"><DashboardHeader activeTab={tab} onRefresh={onRefresh} />{notice && <div className="notice">{notice}<button onClick={() => onNoticeChange?.('')} aria-label="Закрити"><X size={15} /></button></div>}{children}</section></main>
}
