import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { mockTransactions } from '@/data/mock'
import { fetchTransactions, cancelTransaction, confirmTransaction, deleteTransaction } from '../services/transactionService'
import type { Transaction, TransactionFilters } from '../types'

const PAGE_SIZE = 25

export function useTransactions(filters: Partial<TransactionFilters> = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const filtersRef              = useRef(filters)
  filtersRef.current            = filters

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)

    if (!isSupabaseConfigured) {
      // ── mock mode ──────────────────────────────────────────
      let data = [...mockTransactions] as Transaction[]
      const f  = filtersRef.current

      if (f.search)
        data = data.filter(t => t.description.toLowerCase().includes(f.search!.toLowerCase()))
      if (f.type)     data = data.filter(t => t.type === f.type)
      if (f.status)   data = data.filter(t => t.status === f.status)
      if (f.accountId) data = data.filter(t => t.account_id === f.accountId || t.destination_account_id === f.accountId)
      if (f.categoryId) data = data.filter(t => t.category_id === f.categoryId)

      data.sort((a, b) => {
        const ef = (b.effective_date ?? b.occurred_on).localeCompare(a.effective_date ?? a.occurred_on)
        if (ef !== 0) return ef
        return b.created_at.localeCompare(a.created_at)
      })

      const offset = (p - 1) * PAGE_SIZE
      setTotal(data.length)
      setTransactions(data.slice(offset, offset + PAGE_SIZE) as Transaction[])
      setLoading(false)
      return
    }

    try {
      const { data, count } = await fetchTransactions({
        ...filtersRef.current,
        limit:  PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setTransactions(data)
      setTotal(count)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + filter change
  useEffect(() => {
    setPage(1)
    load(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.search, filters.type, filters.status, filters.source,
    filters.accountId, filters.categoryId, filters.dateFrom, filters.dateTo,
    filters.minAmount, filters.maxAmount, filters.isRecurring,
  ])

  // Page change
  useEffect(() => {
    if (page > 1) load(page)
  }, [page, load])

  // Realtime
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const ch = supabase
      .channel('tx-realtime')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'transactions' }, () => load(page))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load, page])

  // ── Actions ───────────────────────────────────────────────
  async function cancel(id: string) {
    if (!isSupabaseConfigured) {
      setTransactions(p => p.map(t => t.id === id ? { ...t, status: 'cancelled' } : t))
      return
    }
    await cancelTransaction(id)
    await load(page)
  }

  async function confirm(id: string) {
    if (!isSupabaseConfigured) {
      setTransactions(p => p.map(t => t.id === id ? { ...t, status: 'completed' } : t))
      return
    }
    await confirmTransaction(id)
    await load(page)
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) {
      setTransactions(p => p.filter(t => t.id !== id))
      return
    }
    await deleteTransaction(id)
    await load(page)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return {
    transactions, loading, error,
    total, page, totalPages,
    setPage,
    cancel, confirm, remove,
    refetch: () => load(page),
  }
}
