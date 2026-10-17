'use client';

import React, { useEffect, useState } from 'react';
import { request } from '@/lib/api.ts';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

interface Wallet {
    id: string;
    currency: string;
    availableBalance: number;
    frozenBalance: number;
    totalBalance: number;
    createdAt: string;
}

interface UserRequisite {
    id: string;
    created_at: string;
    is_deleted: boolean;
    is_alowed_work: boolean;
    min_amount: number;
    max_amount: number;
    daily_max_turnover: number;
    daily_max_tx: number;
    total_max_tx: number;
    card_number: string;
    card_holder: string;
    bank_name: string;
    currency: string;
    is_active: boolean;
    cooldown_seconds: number;
    active_orders: number;
    total_opened_orders: number;
    total_success_orders: number;
    total_canceled_orders: number;
}

interface UserOrder {
    id: string;
    amount: number;
    exchange_rate: number;
    amount_usdt: number;
    completed_amount: number | null;
    status: number;
    card: string;
    currency: string;
    receiver_name: string;
    receiver_bank: string;
    created_at: string;
    deadline_at: string;
    completed_at: string | null;
}

interface UserDispute {
    appeal_id: string;
    order_id: string;
    status_code: number;
    reject_reason: string | null;
    reject_reason_text: string | null;
    new_amount: number | null;
    order_amount: number;
    created_at: string;
    resolved_at: string | null;
    declined_at: string | null;
    files: unknown[];
}

interface UserProfile {
    id: string;
    login: string;
    role: string;
    user_status_code: number;
    is_active?: boolean;
    created_at: string;
    wallet: Wallet | null;
    user_requisits: UserRequisite[];
    user_orders: UserOrder[];
    user_disputes: UserDispute[];
}

interface UserResponse {
    user: UserProfile | null;
}

const ORDER_STATUS: Record<number, { label: string; className: string }> = {
    5: {
        label: 'Completed',
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    },
    2: {
        label: 'Pending',
        className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    },
    9: {
        label: 'Expired',
        className: 'bg-red-50 text-red-700 ring-red-600/20',
    },
    4: {
        label: 'Expired',
        className: 'bg-red-50 text-red-700 ring-red-600/20',
    },
};

const DISPUTE_STATUS: Record<number, { label: string; className: string }> = {
    1: {
        label: 'Pending',
        className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    },
    2: {
        label: 'Declined',
        className: 'bg-red-50 text-red-700 ring-red-600/20',
    },
    3: {
        label: 'Resolved',
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    },
};

function formatDate(date: string | null) {
    if (!date) return '—';

    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

function formatMoney(value: number, currency: string) {
    return (
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value) + ` ${currency}`
    );
}

function maskCard(card: string) {
    if (!card) return '—';

    return `•••• •••• •••• ${card.slice(-4)}`;
}

function getStatus(
    status: number,
    statuses: Record<number, { label: string; className: string }>
) {
    return statuses[status] ?? {
        label: `Status ${status}`,
        className: 'bg-slate-50 text-slate-700 ring-slate-600/20',
    };
}

function StatusBadge({
    label,
    className,
}: {
    label: string;
    className: string;
}) {
    return (
        <span
            className={[
                'inline-flex items-center rounded-full px-2.5 py-1',
                'text-xs font-semibold ring-1 ring-inset',
                className,
            ].join(' ')}
        >
            {label}
        </span>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">{text}</p>
        </div>
    );
}

function PaginationPlaceholder() {
    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
                Pagination will be connected to the API later
            </p>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400"
                >
                    Previous
                </button>

                <span className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                    1
                </span>

                <button
                    type="button"
                    disabled
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function Toggle({
    checked,
    disabled,
    onChange,
}: {
    checked: boolean;
    disabled?: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={[
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
                checked ? 'bg-emerald-500' : 'bg-slate-300',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            ].join(' ')}
        >
            <span
                className={[
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm',
                    'transition-transform duration-200',
                    checked ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
            />
        </button>
    );
}

function AddBalanceModal({
    userId,
    currency,
    onClose,
    onSuccess,
}: {
    userId: string;
    currency: string;
    onClose: () => void;
    onSuccess: () => Promise<void>;
}) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const parsedAmount = Number(amount);

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setError('Enter a valid amount greater than 0.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await request('/api/wallet/deposit', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    amount: parsedAmount,
                }),
            });

            await onSuccess();
            onClose();
        } catch (error) {
            console.error('Unable to deposit balance', error);
            setError('Unable to add balance. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) {
                    onClose();
                }
            }}
        >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Add balance
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Add funds to the user's wallet
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                    <label
                        htmlFor="deposit-amount"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Amount
                    </label>

                    <div className="relative mt-2">
                        <input
                            id="deposit-amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            placeholder="70.10"
                            disabled={loading}
                            autoFocus
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-16 text-lg font-semibold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                            {currency}
                        </span>
                    </div>

                    {error && (
                        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add balance'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UserPage({ params }: PageProps) {
    const { id } = React.use(params);

    const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
    const [isUserActive, setIsUserActive] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const [userToggleLoading, setUserToggleLoading] = useState(false);
    const [credentialToggleLoading, setCredentialToggleLoading] =
        useState<string | null>(null);

    const [actionError, setActionError] = useState<string | null>(null);

    const loadUserInfo = async (userId: string) => {
        try {
            setLoading(true);
            setError(null);

            const userData: UserResponse = await request(
                `/api/users/${userId}`
            );

            setUserInfo(userData.profile ?? null);

            if (userData?.profile?.user_status_code == 1)
            {
                setIsUserActive(true);
            }
        } catch (error) {
            console.error('Unable to loadUserInfo', error);
            setError('Unable to load user information');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserInfo(id);
    }, [id]);

    const handleUserToggle = async (isActive: boolean) => {
        if (!userInfo) return;

        try {
            setUserToggleLoading(true);
            setActionError(null);

            await request('/api/users/toggle', {
                method: 'PATCH',
                body: JSON.stringify({
                    user_id: userInfo.id,
                    is_active: isActive,
                }),
            });

            setUserInfo((current) =>
                current
                    ? {
                          ...current,
                          is_active: isActive,
                      }
                    : current
            );

            setIsUserActive(isActive)
        } catch (error) {
            console.error('Unable to toggle user', error);
            setActionError('Unable to change user status.');
        } finally {
            setUserToggleLoading(false);
        }
    };

    const handleCredentialToggle = async (
        credentialId: string,
        enabled: boolean
    ) => {
        try {
            setCredentialToggleLoading(credentialId);
            setActionError(null);

            await request('/api/credentials', {
                method: 'PATCH',
                body: JSON.stringify({
                    user_requisit_id: credentialId,
                    enabled,
                }),
            });

            setUserInfo((current) => {
                if (!current) return current;

                return {
                    ...current,
                    user_requisits: current.user_requisits.map(
                        (requisite) =>
                            requisite.id === credentialId
                                ? {
                                      ...requisite,
                                      is_active: enabled,
                                  }
                                : requisite
                    ),
                };
            });
        } catch (error) {
            console.error('Unable to toggle credential', error);
            setActionError('Unable to change credential status.');
        } finally {
            setCredentialToggleLoading(null);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="animate-pulse space-y-6">
                        <div className="h-36 rounded-2xl bg-slate-200" />

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="h-28 rounded-2xl bg-slate-200"
                                />
                            ))}
                        </div>

                        <div className="h-80 rounded-2xl bg-slate-200" />
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        !
                    </div>

                    <h1 className="mt-4 text-lg font-semibold text-slate-900">
                        Something went wrong
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        {error}
                    </p>

                    <button
                        onClick={() => loadUserInfo(id)}
                        className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Try again
                    </button>
                </div>
            </main>
        );
    }

    if (!userInfo) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <EmptyState text="User not found" />
            </main>
        );
    }

    const wallet = userInfo.wallet;

    const completedOrders =
        userInfo.user_orders?.filter((order) => order.status === 5).length ?? 0;

    const pendingOrders =
        userInfo.user_orders?.filter((order) => order.status === 9).length ?? 0;

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

                {/* Header */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                            <div className="flex min-w-0 items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                                    {userInfo.login
                                        .slice(0, 1)
                                        .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                                            {userInfo.login}
                                        </h1>

                                        <StatusBadge
                                            label={userInfo.role}
                                            className="bg-purple-50 text-purple-700 ring-purple-600/20"
                                        />
                                    </div>

                                    <p className="mt-1 truncate text-sm text-slate-500">
                                        ID: {userInfo.id}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Created{' '}
                                        {formatDate(userInfo.created_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                                {/* User toggle */}
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">
                                            User status
                                        </p>

                                        <p
                                            className={[
                                                'text-sm font-semibold',
                                                isUserActive
                                                    ? 'text-emerald-600'
                                                    : 'text-slate-500',
                                            ].join(' ')}
                                        >
                                            {isUserActive
                                                ? 'Active'
                                                : 'Inactive'}
                                        </p>
                                    </div>

                                    <Toggle
                                        checked={isUserActive}
                                        disabled={userToggleLoading}
                                        onChange={handleUserToggle}
                                    />
                                </div>

                                {/* Deposit */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDepositModalOpen(true)
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                                >
                                    <span className="text-lg leading-none">
                                        +
                                    </span>
                                    Add balance
                                </button>
                            </div>
                        </div>

                        {actionError && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {actionError}
                            </div>
                        )}
                    </div>
                </section>

                {/* Stats */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Available balance
                        </p>

                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                            {wallet
                                ? formatMoney(
                                      wallet.availableBalance,
                                      wallet.currency
                                  )
                                : '—'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Available funds
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Frozen balance
                        </p>

                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                            {wallet
                                ? formatMoney(
                                      wallet.frozenBalance,
                                      wallet.currency
                                  )
                                : '—'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Currently frozen
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Completed orders
                        </p>

                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                            {completedOrders}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            {userInfo.user_orders?.length ?? 0} total orders
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Pending orders
                        </p>

                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                            {pendingOrders}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Awaiting completion
                        </p>
                    </div>
                </section>

                {/* Wallet */}
                {wallet && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Wallet
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Current wallet information
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setDepositModalOpen(true)
                                }
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                                + Add funds
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Currency
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                    {wallet.currency}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Available
                                </p>

                                <p className="mt-1 font-semibold text-emerald-600">
                                    {formatMoney(
                                        wallet.availableBalance,
                                        wallet.currency
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Frozen
                                </p>

                                <p className="mt-1 font-semibold text-amber-600">
                                    {formatMoney(
                                        wallet.frozenBalance,
                                        wallet.currency
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Total
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                    {formatMoney(
                                        wallet.totalBalance,
                                        wallet.currency
                                    )}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Requisites */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Payment requisites
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                User payment methods and limits
                            </p>
                        </div>

                        <span className="text-sm text-slate-500">
                            {userInfo.user_requisits?.length ?? 0} requisites
                        </span>
                    </div>

                    {userInfo.user_requisits?.length ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {userInfo.user_requisits.map((requisite) => (
                                <div
                                    key={requisite.id}
                                    className="rounded-xl border border-slate-200 p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-slate-900">
                                                {requisite.bank_name}
                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {
                                                    requisite.card_number
                                                }
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3">
                                            <div className="hidden text-right sm:block">
                                                <p className="text-xs text-slate-400">
                                                    {requisite.is_active
                                                        ? 'Enabled'
                                                        : 'Disabled'}
                                                </p>
                                            </div>

                                            <Toggle
                                                checked={
                                                    requisite.is_active
                                                }
                                                disabled={
                                                    credentialToggleLoading ===
                                                    requisite.id
                                                }
                                                onChange={(enabled) =>
                                                    handleCredentialToggle(
                                                        requisite.id,
                                                        enabled
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-400">
                                                Card holder
                                            </p>

                                            <p className="mt-1 font-medium text-slate-800">
                                                {requisite.card_holder}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-400">
                                                Currency
                                            </p>

                                            <p className="mt-1 font-medium text-slate-800">
                                                {requisite.currency}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-400">
                                                Min amount
                                            </p>

                                            <p className="mt-1 font-medium text-slate-800">
                                                {formatMoney(
                                                    requisite.min_amount,
                                                    requisite.currency
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-400">
                                                Max amount
                                            </p>

                                            <p className="mt-1 font-medium text-slate-800">
                                                {formatMoney(
                                                    requisite.max_amount,
                                                    requisite.currency
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-400">
                                                Active orders
                                            </p>

                                            <p className="mt-1 font-medium text-slate-800">
                                                {requisite.active_orders}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-400">
                                                Success / Canceled
                                            </p>

                                            <p className="mt-1 font-medium text-slate-800">
                                                {
                                                    requisite.total_success_orders
                                                }
                                                {' / '}
                                                {
                                                    requisite.total_canceled_orders
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="No payment requisites" />
                    )}
                </section>

                {/* Orders */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-5 sm:p-6">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Orders
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    User transaction history
                                </p>
                            </div>

                            <span className="text-sm text-slate-500">
                                {userInfo.user_orders?.length ?? 0} orders
                            </span>
                        </div>

                        {userInfo.user_orders?.length ? (
                            <>
                                <div className="space-y-3 md:hidden">
                                    {userInfo.user_orders.map((order) => {
                                        const status = getStatus(
                                            order.status,
                                            ORDER_STATUS
                                        );

                                        return (
                                            <div
                                                key={order.id}
                                                className="rounded-xl border border-slate-200 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {formatMoney(
                                                                order.amount,
                                                                order.currency
                                                            )}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {formatDate(
                                                                order.created_at
                                                            )}
                                                        </p>
                                                    </div>

                                                    <StatusBadge
                                                        label={status.label}
                                                        className={
                                                            status.className
                                                        }
                                                    />
                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-slate-400">
                                                            USDT
                                                        </p>
                                                        <p className="font-medium">
                                                            {
                                                                order.amount_usdt
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-slate-400">
                                                            Rate
                                                        </p>
                                                        <p className="font-medium">
                                                            {
                                                                order.exchange_rate
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-slate-400">
                                                            Receiver
                                                        </p>
                                                        <p className="font-medium">
                                                            {
                                                                order.receiver_name
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-slate-400">
                                                            Bank
                                                        </p>
                                                        <p className="font-medium">
                                                            {
                                                                order.receiver_bank
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full min-w-[850px] text-left">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                                                <th className="px-4 py-3 font-medium">
                                                    Order
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Amount
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Rate
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Receiver
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Created
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {userInfo.user_orders.map(
                                                (order) => {
                                                    const status = getStatus(
                                                        order.status,
                                                        ORDER_STATUS
                                                    );

                                                    return (
                                                        <tr
                                                            key={order.id}
                                                            className="transition hover:bg-slate-50"
                                                        >
                                                            <td className="px-4 py-4">
                                                                <p className="font-medium text-slate-900">
                                                                    {order.id.slice(
                                                                        0,
                                                                        8
                                                                    )}
                                                                    ...
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-400">
                                                                    {
                                                                        order.currency
                                                                    }
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-4">
                                                                <p className="font-semibold text-slate-900">
                                                                    {formatMoney(
                                                                        order.amount,
                                                                        order.currency
                                                                    )}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {
                                                                        order.amount_usdt
                                                                    }{' '}
                                                                    USDT
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-4 text-sm text-slate-700">
                                                                {
                                                                    order.exchange_rate
                                                                }
                                                            </td>

                                                            <td className="px-4 py-4">
                                                                <p className="text-sm font-medium text-slate-900">
                                                                    {
                                                                        order.receiver_name
                                                                    }
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {
                                                                        order.receiver_bank
                                                                    }
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-4 text-sm text-slate-500">
                                                                {formatDate(
                                                                    order.created_at
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-4">
                                                                <StatusBadge
                                                                    label={
                                                                        status.label
                                                                    }
                                                                    className={
                                                                        status.className
                                                                    }
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-5">
                                    <PaginationPlaceholder />
                                </div>
                            </>
                        ) : (
                            <EmptyState text="No orders found" />
                        )}
                    </div>
                </section>

                {/* Disputes */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-5 sm:p-6">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Disputes
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Appeals and dispute history
                                </p>
                            </div>

                            <span className="text-sm text-slate-500">
                                {userInfo.user_disputes?.length ?? 0} disputes
                            </span>
                        </div>

                        {userInfo.user_disputes?.length ? (
                            <>
                                <div className="space-y-3">
                                    {userInfo.user_disputes.map((dispute) => {
                                        const status = getStatus(
                                            dispute.status_code,
                                            DISPUTE_STATUS
                                        );

                                        return (
                                            <div
                                                key={`${dispute.order_id}-${dispute.created_at}`}
                                                className="rounded-xl border border-slate-200 p-4"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-semibold text-slate-900">
                                                                Order{' '}
                                                                {dispute.order_id.slice(
                                                                    0,
                                                                    8
                                                                )}
                                                                ...
                                                            </span>

                                                            <StatusBadge
                                                                label={
                                                                    status.label
                                                                }
                                                                className={
                                                                    status.className
                                                                }
                                                            />
                                                        </div>

                                                        <p className="mt-2 text-sm text-slate-500">
                                                            Created{' '}
                                                            {formatDate(
                                                                dispute.created_at
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="text-left sm:text-right">
                                                        <p className="text-xs text-slate-400">
                                                            Order amount
                                                        </p>

                                                        <p className="mt-1 font-semibold text-slate-900">
                                                            {formatMoney(
                                                                dispute.order_amount,
                                                                'UAH'
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {dispute.reject_reason && (
                                                    <div className="mt-4 rounded-lg bg-red-50 p-3">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                                                            Reject reason
                                                        </p>

                                                        <p className="mt-1 text-sm text-red-700">
                                                            {
                                                                dispute.reject_reason_text
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {dispute.new_amount !== null && (
                                                    <div className="mt-4 text-sm">
                                                        <span className="text-slate-500">
                                                            New amount:{' '}
                                                        </span>

                                                        <span className="font-semibold text-slate-900">
                                                            {formatMoney(
                                                                dispute.new_amount,
                                                                'UAH'
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-5">
                                    <PaginationPlaceholder />
                                </div>
                            </>
                        ) : (
                            <EmptyState text="No disputes found" />
                        )}
                    </div>
                </section>
            </div>

            {/* Deposit modal */}
            {depositModalOpen && (
                <AddBalanceModal
                    userId={userInfo.id}
                    currency={wallet?.currency ?? 'USDT'}
                    onClose={() => setDepositModalOpen(false)}
                    onSuccess={() => loadUserInfo(id)}
                />
            )}
        </main>
    );
}