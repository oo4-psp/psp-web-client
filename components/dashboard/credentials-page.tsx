'use client'

import { DashboardLayout } from './dashboard-layout'
import { renderCredentialsTab } from './views'
import { PAGE_SIZE, useCredentialsData } from './use-page-data'

export default function CredentialsPageClient() {
  const data = useCredentialsData()
  return <DashboardLayout tab="credentials" notice={data.notice} onNoticeChange={data.setNotice} onRefresh={() => void data.load(false)}>{data.loading ? <div className="center-state">Завантаження реквізитів…</div> : renderCredentialsTab({ credentials: data.credentials, credentialsTotal: data.total, credentialsPage: data.page, credentialsPerPage: PAGE_SIZE, setCredentialsPage: data.setPage, toggleCredential: data.toggleCredential, deleteCredential: data.deleteCredential, setEditing: () => {}, setShowForm: () => {} } as never)}</DashboardLayout>
}
