import { useState, useEffect, useCallback, useMemo } from 'react'
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

  // Use a stable string key so Date object identity doesn't trigger re-renders
  const monthKey = month
    ? `${month.getFullYear()}-${month.getMonth()}`
    : undefined

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dateRange = useMemo(() => {
    if (!month) return null
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    return { start, end, startStr: start.toISOString().split('T')[0], endStr: end.toISOString().split('T')[0] }
  // monthKey is the stable dependency, not month reference
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey])

  const fetchTransactions = useCallback(async () => {
    if (!isSupabaseConfigured) {
      let data = mockTransactions.filter(t => t.status === status)
      if (accountId) data = data.filter(t => t.account_id === accountId)
      if (dateRange) {
        data = data.filter(t => {
          const d = new Date(t.occurred_on)
          return d >= dateRange.start && d <= dateRange.end
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
      if (dateRange) {
        query = query.gte('occurred_on', dateRange.startStr).lte('occurred_on', dateRange.endStr)
      }
      const { data, error } = await query
      if (error) throw error
      setTransactions((data as Transaction[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }, [accountId, dateRange, limit, status])

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
