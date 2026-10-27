export type ExchangeRate = { currency: string; value: number }
export type User = { id: string; login: string; role: string }
export type Wallet = { availableBalance: number; frozenBalance: number; totalBalance: number; currency: string }
export type Order = { id: string; amount: number; amount_usdt?: number | null; exchange_rate?: number | null; completed_amount?: number | null; status: number; card: string; currency: string; receiver_name: string; receiver_bank?: string; created_at: string; deadline_at: string; completed_at?: string | null }
export type Credential = { id: string; created_at: string; is_alowed_work: boolean; min_amount: number; max_amount: number; daily_max_turnover: number; daily_max_tx: number; max_open_orders?: number; total_tx?: number; card_number: string; card_holder: string; currency: string; is_active: boolean; active_orders: number; total_opened_orders: number; total_success_orders: number; total_canceled_orders: number }
export type UserInfo = { id: string; login: string; role: string; wallet: Wallet; is_online: boolean }
export type Dispute = { appeal_id: string; order_id: string; status_code: number; reject_reason: string; reject_reason_text: string; new_amount: number | null; created_at: string; resolved_at: string | null; declined_at: string | null }

export const ORDER_STATUS: Record<number, string> = { 1: 'Нова', 2: 'Очікує оплати', 3: 'Клієнт оплатив', 4: 'Клієнт скасував', 5: 'Виконано', 6: 'Апеляція', 7: 'Not taken', 9: 'Прострочено' }
export const APPEAL_STATUS: Record<number, string> = { 1: 'Відкритий', 2: 'Скасований', 3: 'Схвалений', 4: 'Підтверджений з іншою сумою', 5: 'Потрібні докази' }
export const CONFIRMABLE_ORDER_STATUSES = new Set([2, 4, 6, 9])

export function formatMoney(value: number, currency = 'USDT', digits = 2) {
  const formatted = value.toLocaleString('uk-UA', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return currency === 'none' ? formatted : `${formatted} ${currency}`
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
}

export function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()
}

export function unformatCardNumber(value: string) {
  return value.replace(/\D/g, '')
}
