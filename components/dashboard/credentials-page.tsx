'use client'
import { DashboardLayout } from './dashboard-layout'
import { renderCredentialsTab } from './views'
export default function CredentialsPageClient() { return <DashboardLayout tab="credentials">{(data) => renderCredentialsTab({ credentials: data.credentials, credentialsTotal: data.totals.credentials, credentialsPage: data.pages.credentials, credentialsPerPage: 10, setCredentialsPage: (page: number) => data.setPage('credentials', page), toggleCredential: data.toggleCredential, deleteCredential: data.deleteCredential, setEditing: () => {}, setShowForm: () => {} } as any)}</DashboardLayout> }
