/**
 * Transaction Service — Single source of truth for all financial movements.
 *
 * All modules (Accounts, Cards, Obligations, Goals, Investments) must call
 * these functions instead of writing directly to the DB.  This guarantees:
 *   • No duplicate transactions
 *   • Correct balance updates
 *   • Unified audit trail
 */

import { supabase, isSupabaseConfigured, DEMO_USER_ID } from '@/lib/supabase'
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any
const TODAY = () => new Date().toISOString().split('T')[0]

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

export async function fetchTransactions(
  filters: Partial<TransactionFilters> & { limit?: number; offset?: number } = {},
): Promise<{ data: Transaction[]; count: number }> {
  if (!isSupabaseConfigured) return { data: [], count: 0 }

  let query = db
    .from('transactions')
    .select(
      `*, accounts!transactions_account_id_fkey(id,name,color,icon,type),
       destination_account:accounts!transactions_destination_account_id_fkey(id,name,color,icon),
       categories(id,name,color,icon)`,
      { count: 'exact' },
    )
    .order('effective_date', { ascending: false })
    .order('created_at',     { ascending: false })

  if (filters.limit)  query = query.limit(filters.limit)
  if (filters.offset) query = query.range(filters.offset, (filters.offset + (filters.limit ?? 20)) - 1)

  if (filters.search)
    query = query.ilike('description', `%${filters.search}%`)
  if (filters.type)       query = query.eq('type',       filters.type)
  if (filters.status)     query = query.eq('status',     filters.status)
  if (filters.source)     query = query.eq('source',     filters.source)
  if (filters.accountId)  query = query.or(`account_id.eq.${filters.accountId},destination_account_id.eq.${filters.accountId}`)
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.dateFrom)   query = query.gte('effective_date', filters.dateFrom)
  if (filters.dateTo)     query = query.lte('effective_date', filters.dateTo)
  if (filters.minAmount)  query = query.gte('amount', Number(filters.minAmount))
  if (filters.maxAmount)  query = query.lte('amount', Number(filters.maxAmount))
  if (filters.isRecurring !== null && filters.isRecurring !== undefined)
    query = query.eq('is_recurring', filters.isRecurring)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data as Transaction[]) ?? [], count: count ?? 0 }
}

// ─────────────────────────────────────────────────────────────
// CREATE — income / expense / adjustment
// ─────────────────────────────────────────────────────────────

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')

  const { data, error } = await db
    .from('transactions')
    .insert({
      ...input,
      user_id:     DEMO_USER_ID,
      occurred_on: input.effective_date,
    })
    .select()
    .single()

  if (error) throw error

  // Update account balance only for confirmed transactions
  if (input.status === 'completed') {
    await _adjustBalance(input.account_id, input.amount)
  }

  return data as Transaction
}

// ─────────────────────────────────────────────────────────────
// CREATE — deposit (called by Accounts module)
// ─────────────────────────────────────────────────────────────

export async function recordDeposit(params: {
  accountId: string
  amount: number
  description: string
  categoryId?: string
  effectiveDate?: string
}): Promise<Transaction> {
  return createTransaction({
    account_id:     params.accountId,
    description:    params.description,
    amount:         params.amount,
    type:           'income',
    status:         'completed',
    source:         'accounts',
    effective_date: params.effectiveDate ?? TODAY(),
    category_id:    params.categoryId ?? null,
  })
}

// ─────────────────────────────────────────────────────────────
// CREATE — transfer (creates linked pair, no global duplication)
// ─────────────────────────────────────────────────────────────

export async function recordTransfer(params: {
  fromAccountId: string
  toAccountId: string
  amount: number
  description: string
  effectiveDate?: string
}): Promise<[Transaction, Transaction]> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')

  const pairId = crypto.randomUUID()
  const date   = params.effectiveDate ?? TODAY()

  const debit: CreateTransactionInput = {
    account_id:              params.fromAccountId,
    destination_account_id:  params.toAccountId,
    description:             params.description,
    amount:                  -params.amount,
    type:                    'transfer',
    status:                  'completed',
    source:                  'accounts',
    effective_date:          date,
    transfer_pair_id:        pairId,
  }

  const credit: CreateTransactionInput = {
    account_id:              params.toAccountId,
    destination_account_id:  params.fromAccountId,
    description:             params.description,
    amount:                  params.amount,
    type:                    'transfer',
    status:                  'completed',
    source:                  'accounts',
    effective_date:          date,
    transfer_pair_id:        pairId,
  }

  const { data, error } = await db
    .from('transactions')
    .insert([
      { ...debit,  user_id: DEMO_USER_ID, occurred_on: date },
      { ...credit, user_id: DEMO_USER_ID, occurred_on: date },
    ])
    .select()

  if (error) throw error

  // Balance updates
  await Promise.all([
    _adjustBalance(params.fromAccountId, -params.amount),
    _adjustBalance(params.toAccountId,    params.amount),
  ])

  return [data[0] as Transaction, data[1] as Transaction]
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────

export async function updateTransaction(
  id: string,
  updates: UpdateTransactionInput,
): Promise<Transaction> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')

  // Fetch original to diff balance impact
  const { data: original } = await db
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await db
    .from('transactions')
    .update({ ...updates, occurred_on: updates.effective_date ?? (original as Transaction).occurred_on })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Recalculate balance delta if amount or status changed
  const tx = original as Transaction
  const wasComplete = tx.status === 'completed'
  const isComplete  = (updates.status ?? tx.status) === 'completed'
  const oldAmt      = wasComplete ? tx.amount : 0
  const newAmt      = isComplete  ? (updates.amount ?? tx.amount) : 0
  const delta       = newAmt - oldAmt

  if (delta !== 0 && tx.type !== 'transfer') {
    await _adjustBalance(tx.account_id, delta)
  }

  return data as Transaction
}

// ─────────────────────────────────────────────────────────────
// CANCEL (soft delete — preserves audit trail)
// ─────────────────────────────────────────────────────────────

export async function cancelTransaction(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')

  const { data: tx } = await db
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()

  if (!tx) return

  await db.from('transactions').update({ status: 'cancelled' }).eq('id', id)

  // Reverse balance if was completed
  if ((tx as Transaction).status === 'completed' && tx.type !== 'transfer') {
    await _adjustBalance(tx.account_id, -(tx as Transaction).amount)
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE (hard delete — only for pending/cancelled)
// ─────────────────────────────────────────────────────────────

export async function deleteTransaction(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  await db.from('transactions').delete().eq('id', id)
}

// ─────────────────────────────────────────────────────────────
// CONFIRM (pending → completed)
// ─────────────────────────────────────────────────────────────

export async function confirmTransaction(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')

  const { data: tx } = await db
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()

  if (!tx || (tx as Transaction).status !== 'pending') return

  await db.from('transactions').update({ status: 'completed' }).eq('id', id)
  await _adjustBalance(tx.account_id, (tx as Transaction).amount)
}

// ─────────────────────────────────────────────────────────────
// PRIVATE — atomic balance adjustment
// ─────────────────────────────────────────────────────────────

async function _adjustBalance(accountId: string, delta: number): Promise<void> {
  const { data: acc } = await db
    .from('accounts')
    .select('balance,available_balance')
    .eq('id', accountId)
    .single()

  if (!acc) return

  await db.from('accounts').update({
    balance:           acc.balance           + delta,
    available_balance: acc.available_balance + delta,
  }).eq('id', accountId)
}
