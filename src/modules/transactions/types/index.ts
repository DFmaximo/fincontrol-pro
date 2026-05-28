// ── Core enums ────────────────────────────────────────────────
export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'adjustment'
  | 'card_payment'

export type TransactionStatus = 'pending' | 'completed' | 'cancelled'

export type TransactionSource =
  | 'manual'
  | 'accounts'
  | 'cards'
  | 'obligations'
  | 'goals'
  | 'investments'
  | 'recurring'

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

// ── Account / Category slim refs ─────────────────────────────
export interface AccountRef {
  id: string
  name: string
  color: string
  icon: string
  type: string
}

export interface CategoryRef {
  id: string
  name: string
  color: string
  icon: string
}

// ── Main transaction entity ────────────────────────────────────
export interface Transaction {
  id: string
  user_id: string
  account_id: string
  destination_account_id: string | null
  category_id: string | null
  description: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  source: TransactionSource
  occurred_on: string
  effective_date: string
  is_recurring: boolean
  recurring_transaction_id: string | null
  transfer_pair_id: string | null
  due_date: string | null
  notes: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  // Relations (joined)
  accounts?: AccountRef | null
  destination_account?: AccountRef | null
  categories?: CategoryRef | null
}

// ── Create / update inputs ────────────────────────────────────
export interface CreateTransactionInput {
  account_id: string
  destination_account_id?: string | null
  category_id?: string | null
  description: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  source: TransactionSource
  effective_date: string
  due_date?: string | null
  is_recurring?: boolean
  recurring_frequency?: RecurrenceFrequency
  notes?: string | null
  tags?: string[] | null
  transfer_pair_id?: string | null
}

export type UpdateTransactionInput = Partial<
  Omit<CreateTransactionInput, 'type' | 'transfer_pair_id'>
>

// ── Filter state ──────────────────────────────────────────────
export interface TransactionFilters {
  search: string
  dateFrom: string
  dateTo: string
  type: TransactionType | ''
  status: TransactionStatus | ''
  source: TransactionSource | ''
  accountId: string
  categoryId: string
  minAmount: string
  maxAmount: string
  isRecurring: boolean | null
}

export const DEFAULT_FILTERS: TransactionFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  type: '',
  status: '',
  source: '',
  accountId: '',
  categoryId: '',
  minAmount: '',
  maxAmount: '',
  isRecurring: null,
}

// ── Stats ──────────────────────────────────────────────────────
export interface TransactionStats {
  totalIncome: number
  totalExpense: number
  netBalance: number
  transactionCount: number
  pendingCount: number
  topCategory: { name: string; amount: number; color: string } | null
}

// ── Type metadata (icons, labels, colors) ─────────────────────
export const TRANSACTION_TYPE_META: Record<
  TransactionType,
  { label: string; color: string; bgColor: string }
> = {
  income:       { label: 'Receita',            color: '#00d87f', bgColor: 'rgba(0,216,127,0.1)'  },
  expense:      { label: 'Despesa',            color: '#ff3860', bgColor: 'rgba(255,56,96,0.1)'  },
  transfer:     { label: 'Transferência',      color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)' },
  adjustment:   { label: 'Ajuste',             color: '#ff9443', bgColor: 'rgba(255,148,67,0.1)' },
  card_payment: { label: 'Pgto. Fatura',       color: '#00cce8', bgColor: 'rgba(0,204,232,0.1)'  },
}

export const TRANSACTION_STATUS_META: Record<
  TransactionStatus,
  { label: string; color: string; bgColor: string }
> = {
  completed: { label: 'Confirmada', color: '#00d87f', bgColor: 'rgba(0,216,127,0.1)'  },
  pending:   { label: 'Pendente',   color: '#ff9443', bgColor: 'rgba(255,148,67,0.1)' },
  cancelled: { label: 'Cancelada',  color: '#ff3860', bgColor: 'rgba(255,56,96,0.08)' },
}

export const TRANSACTION_SOURCE_META: Record<
  TransactionSource,
  { label: string; color: string }
> = {
  manual:      { label: 'Manual',       color: '#8490b0' },
  accounts:    { label: 'Contas',       color: '#00d87f' },
  cards:       { label: 'Cartões',      color: '#8b5cf6' },
  obligations: { label: 'Obrigações',   color: '#ff9443' },
  goals:       { label: 'Metas',        color: '#00cce8' },
  investments: { label: 'Investimentos',color: '#ffd60a' },
  recurring:   { label: 'Recorrente',   color: '#00cce8' },
}
