'use client'

import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import Link from "next/link";
import { Pagination } from '@/components/pagination'
import {
  ArrowRight,
  Check,
  Scale,
  CreditCard,
  Users,
  LayoutDashboard,
  LogOut,
  Pencil,
  Trash,
  Plus,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react'

import { request } from '@/lib/api'
import { DashboardHeader, DashboardSidebar } from '@/components/dashboard/navigation'
import {
  renderCredentialsTab,
  renderOrdersTab,
  renderUserDisputesTab,
  renderAdminUsersTab,
  CredentialForm,
} from '@/components/dashboard/views'
import {
    APPEAL_STATUS as appealStatusNames,
    CONFIRMABLE_ORDER_STATUSES as confirmable,
    ORDER_STATUS as statusNames,
    formatCardNumber,
    formatDate as date,
    formatMoney as money,
    unformatCardNumber,
    type Credential,
    type Dispute,
    type ExchangeRate,
    type Order,
    type User,
    type UserInfo,
    type Wallet,
} from '@/lib/domain'

type Disput = Dispute

export default function DashboardClient({ initialTab }: { initialTab: 'orders' | 'credentials' | 'disputes' | 'admin-users' }) {
    const [user, setUser] = useState<User | null>(null)
    const [wallet, setWallet] = useState<Wallet | null>(null)
    const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [appeals, setAppeals] = useState<Disput[]>([])
    const [credentials, setCredentials] = useState<Credential[]>([])
    const [tab, setTab] = useState<'orders' | 'credentials' | 'disputes' | 'admin-users'>(initialTab)
    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<Credential | null>(null)
    const [notice, setNotice] = useState('')
    const [ordersPage, setOrdersPage] = useState(1)
    const [credentialsPage, setCredentialsPage] = useState(1)
    const [appealsPage, setAppealsPage] = useState(1);
    const [adminUsersPage, setAdminUsersPage] = useState(1);
    const [users, setUsers] = useState<UserInfo[]>([])
    const [ordersTotal, setOrdersTotal] = useState(0)
    const [credentialsTotal, setCredentialsTotal] = useState(0)
    const [adminUsersTotal, setAdminUsersTotal] = useState(0);
    const [appealsTotal, setAppealsTotal] = useState(0);
    const ordersPerPage = 10
    const credentialsPerPage = 10
    const usersPerPage = 10;
    const appealsPerPage = 10;

    async function request(path: string, options: RequestInit = {}) {
        const response = await fetch(path, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } })
        if (!response.ok) 
            throw new Error(await response.text())
        return response.status === 204 ? null : response.json()
    }
  
    async function loadOrders() {
	    try {
		    const orderData = await request(`/api/orders?limit=${ordersPerPage}&page=${ordersPage}`)
		    setOrders(orderData.orders ?? [])
		    setOrdersTotal(orderData.total ?? orderData.count ?? (orderData.orders ?? []).length)
	    } catch (e) {
			console.error('Failed to refresh orders', e)
		}
	}

    async function loadUsers()
    {
        try {
            const usersData = await request(`/api/users?limit=${usersPerPage}&page=${adminUsersPage}`);
            setUsers(usersData.users ?? []);
            setAdminUsersTotal(usersData.total ?? usersData.count ?? (usersData.users ?? []).length);
        } catch (e) {
            console.error('Failed to load users', e)
        }
    }

    async function loadDisputes()
    {
        try {
            const appealsData = await request(`/api/appeals?limit=${appealsPerPage}&page=${appealsPage}`);
            setAppeals(appealsData.appeals ?? []);
            setAppealsTotal(appealsData.total ?? appealsData.count ?? (appealsData.appeals ?? []).length)
        } catch (e) {
            console.error('Failed to load disputes', e)
        }
    }

    async function loadData(options: { showLoading?: boolean } = {}) {
        if (options.showLoading !== false) 
            setLoading(true);

        try {
            const [me, orderData, credentialData, exchangeRateData] = await Promise.all([
                request('/api/auth/me', { method: 'POST' }),
                request(`/api/orders?limit=${ordersPerPage}&page=${ordersPage}`),
                request(`/api/credentials?limit=${credentialsPerPage}&page=${credentialsPage}`),
		        request('/api/wallet/exchange-rate/UAH')
            ]);

            setUser(me.user)
            setWallet(me.wallet)
            setOrders(orderData.orders ?? [])
            setOrdersTotal(orderData.total ?? orderData.count ?? (orderData.orders ?? []).length)
            setCredentials(credentialData.requisits ?? credentialData.credentials ?? [])
            setCredentialsTotal(credentialData.total ?? credentialData.count ?? (credentialData.requisits ?? credentialData.credentials ?? []).length)
	        setExchangeRate(exchangeRateData.data)

            if (tab == 'admin-users')
            {
                loadUsers();
            }
            loadDisputes();
        } 
        catch { 
            setUser(null) 
        } 
        finally { 
            setLoading(false) 
        }
    }

    useEffect(() => { 
        loadData() 
    }, [])

    useEffect(() => {
        if (user) 
            loadData({ showLoading: false });
    }, [ordersPage, credentialsPage, appealsPage, adminUsersPage])

    useEffect(() => {
	    if (!user) return

	    const interval = setInterval(() => {
		    loadOrders()
	    }, 7000)

	    return () => clearInterval(interval)
	}, [user, ordersPage])

    useEffect(() => {
        if (!user) return;

        if (tab == 'admin-users')
        {
            loadUsers();
        }
    }, [tab]);

    async function submitLogin(event: FormEvent) {
        event.preventDefault(); setLoginError('')
        try { 
            await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ login, password, role: 'TRADER' }) }); 
            await loadData();
        }
        catch { 
            setLoginError('Не вдалося увійти. Перевірте логін і пароль.') 
        }
    }

    async function fixOrder(id: string, amount: string, currency: string)
    {
        let userResponse = confirm(`Ви впевнені, що хочете пофіксити угоду? На - ${amount} ${currency}`);
	    if (!userResponse)
		    return;

        let new_amount = null;
        let newAmountPrompt = prompt(`Яку суму ви отримали фактично? Не вводьте нічого, якщо сума ордер співпадає з фактичною сумою`);
        if (newAmountPrompt !== null) {
            let amount = parseFloat(newAmountPrompt);

            if (!isNaN(amount) && amount <= 30000) {
                new_amount = amount.toFixed(2);
            }
        }

        try { 
            await request('/api/appeals/fix', { method: 'POST', body: JSON.stringify({ order_id: id, new_amount }) }); 
            setNotice('Ордер пофікшено'); 
            await loadData();
        }
        catch { 
            setNotice('Не вдалося пофіксити ордер');
        }
    }

    async function releaseOrder(id: string, amount: string, currency: string) {
	    let userResponse = confirm(`Ви впевнені, що хочете підтвердити угоду? На - ${amount} ${currency}`);
	    if (!userResponse)
		    return;

        let new_amount = null;
        let newAmountPrompt = prompt(`Яку суму ви отримали фактично? Не вводьте нічого, якщо сума ордер співпадає з фактичною сумою`);
        if (newAmountPrompt !== null) {
            let amount = parseFloat(newAmountPrompt);

            if (!isNaN(amount) && amount <= 30000) {
                new_amount = amount.toFixed(2);
            }
        }

        try { 
            await request('/api/orders/release', { method: 'POST', body: JSON.stringify({ id, new_amount }) }); 
            setNotice('Ордер підтверджено'); 
            await loadData();
        }
        catch { 
            setNotice('Не вдалося підтвердити ордер');
        }
    }

    async function deleteCredential(item: Credential)
    {
        try {
            let userResponse = confirm(`Ви впевнені, що хочете видалити реквізит ${item.card_holder}?`);
	        if (!userResponse)
		        return;

            await request('/api/credentials', { method: 'DELETE', body: JSON.stringify({ cred_id: item.id }) });
            setNotice('Реквізит видалено');

            await loadData();
        } catch (error) {
            setNotice('Не вдалося видалити реквізит');
        }
    }

    async function toggleCredential(item: Credential) {
        try { 
            await request('/api/credentials', { method: 'PATCH', body: JSON.stringify({ user_requisit_id: item.id, enabled: !item.is_active }) }); 
            await loadData(); 
        }
        catch { 
            setNotice('Не вдалося змінити стан реквізиту');
        }
    }

    async function saveCredential(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); 
	    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>
        const payload = { 
            ...data, 
            card_number: unformatCardNumber(data.card_number ?? ''), 
            min_amount: Number(data.min_amount), 
            max_amount: Number(data.max_amount), 
            daily_max_turnover: Number(data.daily_max_turnover), 
            daily_max_tx: Number(data.daily_max_tx), 
            max_open_orders: Number(data.max_open_orders), 
            total_tx: Number(data.total_max_tx) 
        }
        try { 
		    await request('/api/credentials', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(editing ? { user_requisit_id: editing.id, ...payload } : payload) }); 
            setShowForm(false); 
            setEditing(null); 
            await loadData(); 
        }
        catch { 
            setNotice('Не вдалося зберегти реквізит'); 
        }
    }

    const renderTab = (currentTab: 'orders' | 'credentials' | 'disputes' | 'admin-users') => {
        switch (currentTab) {
            case 'orders':
                return renderOrdersTab({
                    user: user,
                    wallet: wallet,
                    exchangeRate: exchangeRate,
                    ordersTotal: ordersTotal,
                    orders: orders,
                    releaseOrder: releaseOrder,
                    fixOrder: fixOrder,
                    ordersPage: ordersPage,
                    ordersPerPage: ordersPerPage,
                    setOrdersPage: setOrdersPage
                });

            case 'credentials':
                return renderCredentialsTab({
                    credentials: credentials,
                    toggleCredential: toggleCredential,
                    credentialsPage: credentialsPage,
                    credentialsTotal: credentialsTotal,
                    credentialsPerPage: credentialsPerPage,
                    setCredentialsPage: setCredentialsPage,
                    setEditing: setEditing,
                    setShowForm: setShowForm,
                    deleteCredential: deleteCredential
                });

            case 'admin-users':
                return renderAdminUsersTab({
                    users: users,
                    onPageChange: setAdminUsersPage,
                    adminUsersPage: adminUsersPage,
                    adminUsersTotal: adminUsersTotal,
                    usersPerPage: usersPerPage
                });
            case 'disputes':
                return renderUserDisputesTab({
                    appeals: appeals,
                    page: appealsPage,
                    total: appealsTotal,
                    pageSize: appealsPerPage,
                    onPageChange: setAppealsPage
                });
            default:
                return null;
        }
    };

    if (loading) 
        return (<main className="center-state">
                    <RefreshCw className="spin" />
                    <span>Завантаження кабінету…</span>
                </main>);
    if (!user) 
        return (<main className="login-page">
                    <div className="login-card">
                        <div className="brand-mark">
                            <ShieldCheck size={24} />
                        </div>
                        <p className="eyebrow">TRADER PORTAL</p>
                        <h1>Вхід у кабінет</h1>
                        <p className="muted">Керуйте ордерами та платіжними реквізитами в одному місці.</p>
                        <form onSubmit={submitLogin} className="login-form">
                            <label>Логін<input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Введіть логін" required /></label>
                            <label>Парол��<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введіть пароль" required /></label>
                            
                            {loginError && <p className="error-text">{loginError}</p>}
                            <button className="primary-button" type="submit">Увійти <ArrowRight size={17} /></button>
                        </form>
                    </div>
                </main>);
	
	return (
    <main className="app-shell">
        <DashboardSidebar
          user={user}
          activeTab={tab}
          onTabChange={setTab}
          onLogout={() => {
            setUser(null)
            setWallet(null)
          }}
        />

        <section className="content">
            <DashboardHeader activeTab={tab} onRefresh={() => loadData()} />

            {notice && (
                <div className="notice">
                    {notice}
                    <button onClick={() => setNotice('')}>
                        <X size={15} />
                    </button>
                </div>
            )}

            {renderTab(tab)}
        </section>

        {showForm && (
            <CredentialForm
                editing={editing}
                onClose={() => {
                    setShowForm(false);
                    setEditing(null);
                }}
                onSubmit={saveCredential}
            />
        )}
    </main>
);

}

