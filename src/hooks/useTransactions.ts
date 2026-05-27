import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { mockTransactions } from '@/data/mock'
import type { Transaction } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface UseTransactionsOptions {
  accountId?: string
  month?: Date
  limit?: number
  status?: string
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { accountId, month, limit = 10, status = 'completed' } = options
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!isSupabaseConfigured) {
      let data = mockTransactions.filter(t => t.status === status)
      if (accountId) data = data.filter(t => t.account_id === accountId)
      if (month) {
        const start = new Date(month.getFullYear(), month.getMonth(), 1)
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
        data = data.filter(t => {
          const d = new Date(t.occurred_on)
          return d >= start && d <= end
        })
      }
      data = data.sort((a, b) => b.occurred_on.localeCompare(a.occurred_on)).slice(0, limit)
      setTransactions(data)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      let query = db
        .from('transactions')
        .select('*, accounts(*), categories(*)')
        .eq('status', status)
        .order('occurred_on', { ascending: false })
        .limit(limit)
      if (accountId) query = query.eq('account_id', accountId)
      if (month) {
        const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0]
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0]
        query = query.gte('occurred_on', start).lte('occurred_on', end)
      }
      const { data, error } = await query
      if (error) throw error
      setTransactions((data as Transaction[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }, [accountId, month, limit, status])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const channel = supabase
      .channel('transactions-realtime')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'transactions' }, fetchTransactions)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchTransactions])

  const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return { transactions, loading, error, totalIncome, totalExpense, refetch: fetchTransactions }
}
