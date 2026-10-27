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

export default function Page() {
    const [user, setUser] = useState<User | null>(null)
    const [wallet, setWallet] = useState<Wallet | null>(null)
    const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [appeals, setAppeals] = useState<Disput[]>([])
    const [credentials, setCredentials] = useState<Credential[]>([])
    const [tab, setTab] = useState<'orders' | 'credentials' | 'admin-users'>('orders')
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
        const response = await fetch(`${API}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } })
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

function renderCredentialsTab({
    credentials,
    toggleCredential,
    credentialsPage,
    credentialsTotal,
    credentialsPerPage,
    setCredentialsPage,
    setEditing,
    setShowForm,
    deleteCredential,
}: {
    credentials: Credential[];
    toggleCredential: (item: Credential) => void;
    credentialsPage: number;
    credentialsTotal: number;
    credentialsPerPage: number;
    setCredentialsPage: (page: number) => void;
    setEditing: Dispatch<SetStateAction<Credential | null>>;
    setShowForm: Dispatch<SetStateAction<boolean>>;
    deleteCredential: (item: Credential) => void;
}) {
    return (
        <CredentialsView
                credentials={credentials}
                onToggle={toggleCredential}
                page={credentialsPage}
                total={credentialsTotal}
                pageSize={credentialsPerPage}
                onPageChange={setCredentialsPage}
                onAdd={() => {
                    setEditing(null);
                    setShowForm(true);
                }}
                onEdit={(item) => {
                    setEditing(item);
                    setShowForm(true);
                }}
                onDelete={(item) => {
                    deleteCredential(item);
                }}
            />
    );
}

function renderOrdersTab({
    user,
    wallet,
    exchangeRate,
    ordersTotal,
    orders,
    releaseOrder,
    fixOrder,
    ordersPage,
    ordersPerPage,
    setOrdersPage,
}: {
    user: User | null;
    wallet: Wallet | null;
    exchangeRate: ExchangeRate | null;
    ordersTotal: number;
    orders: Order[];
    releaseOrder: (id: string, amount: string, currency: string) => void;
    fixOrder: (id: string, amount: string, currency: string) => void;
    ordersPage: number;
    ordersPerPage: number;
    setOrdersPage: (page: number) => void;
}) {
    return (
        <>
            <div className="balance-grid">
                <div className="balance-card primary-balance">
                    <div className="balance-icon">
                        <WalletCards size={19} />
                    </div>
                    <span>Загальний баланс</span>
                    <strong>
                        {money(wallet?.totalBalance ?? 0, wallet?.currency)}
                    </strong>
                    <small>USDT гаманець</small>
                </div>

                <div className="balance-card">
                    <span>Доступний</span>
                    <strong>
                        {money(wallet?.availableBalance ?? 0, wallet?.currency)}
                    </strong>
                    <small>Доступно для роботи</small>
                </div>

                <div className="balance-card">
                    <span>Заморожений</span>
                    <strong>
                        {money(wallet?.frozenBalance ?? 0, wallet?.currency)}
                    </strong>
                    <small>У поточних ордерах</small>
                </div>
						
				<div className="balance-card">
                    <span>Курс</span>
                    <strong>
                        {money(exchangeRate?.value ?? 0, exchangeRate?.currency)}
                    </strong>
                    <small>Курс змінюється динамічно</small>
                </div>
            </div>

            <div className="section-heading">
                <div>
                    <h2>Всі ордера</h2>
                    <span className="count-pill">{ordersTotal} заявок</span>
                </div>
                <span className="table-hint">Оновлено щойно</span>
            </div>

            <OrderTable
                user={user}
                orders={orders}
                onFix={fixOrder}
                onRelease={releaseOrder}
                page={ordersPage}
                total={ordersTotal}
                pageSize={ordersPerPage}
                onPageChange={setOrdersPage}
            />
        </>
    );
};

function renderUserDisputesTab({appeals, page, total, pageSize, onPageChange}: {appeals: Disput[]})
{
    return (
        <div className="table-card">
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>OrderID</th>
                            <th>Status</th>
                            <th>Order Amount</th>
                            <th>Disput Amount</th>
                            <th>Disput Created</th>
                            <th>Disput Resolved</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appeals?.map( disput => (
                            <tr key={disput.appeal_id}>
                                <td>
                                    <span
                                        className="order-id"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(disput.order_id);
                                            } catch (error) {
                                                alert("Не вдалося скопіювати ID", error);
                                            }
                                        }}
                                        title="Натисніть, щоб скопіювати повний ID"
                                        style={{ cursor: "pointer" }}
                                    >
                                        {disput.order_id.slice(0, 8)}…
                                    </span>
                                </td>
                                

                                <td>
                                    <span className={`status status-appeal-${disput.status_code}`}>
                                        {appealStatusNames[disput.status_code] ?? `Статус ${order.status_code}`}
                                    </span>
                                </td>

                                <td>
                                    <span>
                                        {disput.order_amount ?? '-'}
                                    </span>
                                </td>

                                <td>
                                    <span>
                                        {disput.new_amount ?? disput.order_amount ?? '-'}
                                    </span>
                                </td>

                                <td>
                                    <span>
                                        {date(disput.created_at)}
                                    </span>
                                </td>

                                <td>
                                    <span>
                                        {date(disput.resolved_at) ?? date(disput.declined_at) ?? '-'}
                                    </span>
                                </td>

                                <td>
                                    <button
                                        className="confirm-button"
                                    >
                                        <Link href={`/dispute/${disput.appeal_id}`}>
                                            Переглянути
                                        </Link>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {appeals.length === 0 && (
                    <div className="empty">Диспутів поки немає</div>
                )}
            </div>

            <Pagination
                page={page}
                total={total}
                pageSize={pageSize}
                onPageChange={onPageChange}
            />
        </div>
    );
}

function renderAdminUsersTab({users, adminUsersPage, onPageChange, adminUsersTotal, usersPerPage}: {users: UserInfo[]}) 
{
    return (
        <div className="table-card">
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Login</th>
                            <th>Role</th>
                            <th>Available Balance</th>
                            <th>Frozen Balance</th>
                            <th>Online</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <span>
                                        {user.id.slice(0, 8)}...
                                    </span>
                                </td>

                                <td>
                                    <span>
                                        {user.login}
                                    </span>
                                </td>

                                <td>
                                    <span>
                                        {user.role}
                                    </span>
                                </td>

                                <td>
                                    <span>
                                        {user.wallet.availableBalance} {user.wallet.currency}
                                    </span>
                                </td>

                                <td>
                                    <span>
                                        {user.wallet.frozenBalance} {user.wallet.currency}
                                    </span>
                                </td>

                                <td>
                                    <span>
                                        {user.is_online}
                                    </span>
                                </td>

                                <td>
                                    <button
                                        className="confirm-button"
                                    >
                                        <Link href={`/user/${user.id}`}>
                                            Керувати
                                        </Link>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!users || users?.length === 0 && (
                    <div className="empty">Користувачів поки немає</div>
                )}
            </div>

            <Pagination
                page={adminUsersPage}
                total={adminUsersTotal}
                pageSize={usersPerPage}
                onPageChange={onPageChange}
            />
        </div>
    );
}

function OrderTable({
    user,
    orders,
    onRelease,
    onFix,
    page,
    total,
    pageSize,
    onPageChange
}: {
    user: User | null;
    orders: Order[];
    onRelease: (id: string, amount: string, currency: string) => void;
    onFix: (id: string, amount: string, currency: string) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}) {
    return (
        <div className="table-card">
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Ордер</th>
                            <th>Сума</th>
                            <th>Курс</th>
                            <th>Карта</th>
                            <th>Отримувач</th>
                            <th>Створено</th>
                            <th>Дедлайн</th>
                            <th>Статус</th>
                            <th />
                            <th />
                        </tr>
                    </thead>

                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td>
                                    <span
                                        className="order-id"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(order.id);
                                            } catch (error) {
                                                alert("Не вдалося скопіювати ID", error);
                                            }
                                        }}
                                        title="Натисніть, щоб скопіювати повний ID"
                                        style={{ cursor: "pointer" }}
                                    >
                                        {order.id.slice(0, 8)}…
                                    </span>
                                </td>
                                

                                <td>
                                    <strong>{money(order.amount, order.currency)}</strong>
									<strong>{order.amount_usdt != null && money(order.amount_usdt, "USDT")}</strong>
									
                                    {order.completed_amount && (
                                        <small className="completed-amount">
                                            Факт: {money(order.completed_amount, order.currency)}
                                        </small>
                                    )}
                                </td>
								
								<td>
									<strong>{order.exchange_rate ?? '—'}</strong>
								</td>

                                <td>
                                    <span className="card-number">
                                        <CreditCard size={14} />
                                        {formatCardNumber(order.card)}
                                    </span>
                                </td>

                                <td>
                                    <strong>{order.receiver_name}</strong>
                                    <small>{order.receiver_bank}</small>
                                </td>

                                <td>{date(order.created_at)}</td>
                                <td>{date(order.deadline_at)}</td>

                                <td>
                                    <span className={`status status-${order.status}`}>
                                        {statusNames[order.status] ?? `Статус ${order.status}`}
                                    </span>

                                    {order.completed_at && (
                                        <small className="completed-date">
                                            Завершена {date(order.completed_at)}
                                        </small>
                                    )}
                                </td>

                                <td>
                                    {confirmable.has(order.status) && (
                                        <button
                                            className="confirm-button"
                                            onClick={() =>
                                                onRelease(
                                                    order.id,
                                                    order.amount.toString(),
                                                    order.currency
                                                )
                                            }
                                        >
                                            <Check size={15} /> Підтвердити
                                        </button>
                                    )}
                                </td>
                                
                                {((user.role == "ADMIN" || user.role == "SUPPORT") && order.status == 5) && (
                                    <td>
                                        <button
                                            className="confirm-button"
                                            onClick={() =>
                                                onFix(
                                                    order.id,
                                                    order.amount.toString(),
                                                    order.currency
                                                )
                                            }
                                        >
                                            <Check size={15} /> Fix
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {orders.length === 0 && (
                    <div className="empty">Ордерів поки немає</div>
                )}
            </div>

            <Pagination
                page={page}
                total={total}
                pageSize={pageSize}
                onPageChange={onPageChange}
            />
        </div>
    );
}

function CredentialsView({
    credentials,
    onToggle,
    onAdd,
    onEdit,
    onDelete,
    page,
    total,
    pageSize,
    onPageChange
}: {
    credentials: Credential[];
    onToggle: (item: Credential) => void;
    onAdd: () => void;
    onEdit: (item: Credential) => void;
    onDelete: (item: Credential) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}) {
    return (
        <>
            <div className="section-heading credentials-heading">
                <div>
                    <h2>Ваші реквізити</h2>
                    <span className="count-pill">{total} реквізити</span>
                </div>

                <button className="primary-button small" onClick={onAdd}>
                    <Plus size={16} /> Додати реквізит
                </button>
            </div>

            <div className="credential-grid">
                {credentials.map((item) => (
                    <article className="credential-card" key={item.id}>
                        <div className="credential-top">
                            <div className="bank-icon">
                                <CreditCard size={20} />
                            </div>

                            <div>
                                <h3>{item.card_holder}</h3>
                                <p>
                                    {item.currency} · {item.card_number}
                                </p>
                            </div>

                            <button
                                className="edit-button"
                                onClick={() => onEdit(item)}
                                aria-label="Редагувати"
                            >
                                <Pencil size={16} />
                            </button>

                            <button
                                className="delete-button"
                                onClick={() => onDelete(item)}
                                aria-label="Видалити"
                            >
                                <Trash size={16} />
                            </button>
                        </div>

                        <div className="toggle-row">
                            <span>
                                <i className={item.is_active ? 'dot on' : 'dot'} />
                                {item.is_active ? 'Активний' : 'Вимкнений'}
                            </span>

                            <button
                                className={item.is_active ? 'switch on' : 'switch'}
                                onClick={() => onToggle(item)}
                                aria-label="Перемкнути стан"
                            >
                                <span />
                            </button>
                        </div>

                        <div className="limits">
                            <div>
                                <small>Сума за операцію</small>
                                <strong>
                                    {money(item.min_amount, 'none', 0)} — {money(item.max_amount, 'none', 0)} {item.currency}
                                </strong>
                            </div>

                            <div>
                                <small>Оборот за день</small>
                                <strong>
                                    {money(item.daily_turnover, 'none', 0)} із {money(item.daily_max_turnover, 'none', 0)}
                                </strong>
                            </div>

                            <div>
                                <small>Транзакцій / день</small>
                                <strong>
                                    {item.total_success_orders} із {item.daily_max_tx}
                                </strong>
                            </div>

                            <div>
                                <small>Активних ордерів</small>
                                <strong>{item.active_orders} із {item.max_open_orders ?? 0}</strong>
                            </div>
                        </div>
                    </article>
                ))}

                {credentials.length === 0 && (
                    <div className="empty">Реквізитів поки немає</div>
                )}

                <Pagination
                    page={page}
                    total={total}
                    pageSize={pageSize}
                    onPageChange={onPageChange}
                />
            </div>
        </>
    );
}


function CredentialForm({
    editing,
    onClose,
    onSubmit
}: {
    editing: Credential | null;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <div
            className="modal-backdrop"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal">
                <div className="modal-head">
                    <div>
                        <p className="eyebrow">РЕКВІЗИТ</p>
                        <h2>{editing ? 'Редагувати реквізит' : 'Новий реквізит'}</h2>
                    </div>

                    <button className="close-button" onClick={onClose}>
                        <X size={19} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="credential-form">
                    <label>
                        Номер картки
                        <input
                            name="card_number"
                            defaultValue={editing?.card_number}
                            required
                        />
                    </label>

                    <label>
                        Ім’я отримувача
                        <input
                            name="card_holder"
                            defaultValue={editing?.card_holder}
                            required
                        />
                    </label>

                    <label>
                        Банк
                        <select name="bank_name" required defaultValue={editing?.bank_name ?? 'Monobank'}>
                            <option value="Monobank">Monobank</option>
                            <option value="PUMB">ПУМБ</option>
                            <option value="ABank">A-Банк</option>
                            <option value="Novapay">Novapay</option>
                            <option value="Privat">Приват Банк</option>
                            <option value="Alliance">Банк Альянс</option>
                            <option value="SenceBank">SenceBank</option>
                            <option value="OTP">OTP</option>
                            <option value="UksibBank">Укрсиб Банк</option>
                            <option value="UkgasBank">Ukgas Bank</option>
                            <option value="OBank">OBank</option>
                            <option value="IziBank">IziBank</option>
                            <option value="KredoBank">KredoBank</option>
                            <option value="FreeBank">FreeBank</option>
                            <option value="MyRaif">MyRaif</option>
                            <option value="UnexBank">UnexBank</option>
                            <option value="GlobusBank">GlobusBank</option>
                            <option value="Bank-Lviv">Банк Львів</option>
                            <option value="Win-Bank">WinBank</option>
                            <option value="Bank-Pivdennyi">Банк Південний</option>
                            <option value="VST Bank">VST Bank</option>
                        </select>
                    </label>

                    <label>
                        Валюта
                        <select name="currency" required defaultValue={editing?.currency ?? 'UAH'}>
                            <option value="UAH">UAH</option>
                        </select>
                    </label>

                    <div className="form-grid">
                        <label>
                            Мін. сума
                            <input
                                name="min_amount"
                                type="number"
                                defaultValue={editing?.min_amount ?? 0}
                                required
                            />
                        </label>

                        <label>
                            Макс. сума
                            <input
                                name="max_amount"
                                type="number"
                                defaultValue={editing?.max_amount ?? 0}
                                required
                            />
                        </label>

                        <label>
                            Оборот / день
                            <input
                                name="daily_max_turnover"
                                type="number"
                                defaultValue={editing?.daily_max_turnover ?? 0}
                                required
                            />
                        </label>

                        <label>
                            Транзакцій / день
                            <input
                                name="daily_max_tx"
                                type="number"
                                defaultValue={editing?.daily_max_tx ?? 0}
                                required
                            />
                        </label>

                        <label>
                            Макс. відкритих ордерів
                            <input
                                name="max_open_orders"
                                type="number"
                                defaultValue={editing?.max_open_orders ?? 1}
                                required
                            />
                        </label>

                        <label>
                            Всього транзакцій
                            <input
                                name="total_max_tx"
                                type="number"
                                defaultValue={editing?.total_max_tx ?? 0}
                                required
                            />
                        </label>
                    </div>

                    <p className="form-note">
                        Стан реквізиту змінюється окремо тумблером у списку.
                    </p>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onClose}
                        >
                            Скасувати
                        </button>

                        <button type="submit" className="primary-button">
                            {editing ? 'Зберегти зміни' : 'Створити реквізит'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
