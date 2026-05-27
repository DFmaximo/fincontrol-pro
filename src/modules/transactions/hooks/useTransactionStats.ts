import { useState, useEffect } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { mockTransactions, mockCategories } from '@/data/mock'
import type { TransactionStats, Transaction } from '../types'

export function useTransactionStats(month: Date) {
  const [stats, setStats]     = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const year  = month.getFullYear()
    const mIdx  = month.getMonth()
    const start = new Date(year, mIdx, 1)
    const end   = new Date(year, mIdx + 1, 0)

    if (!isSupabaseConfigured) {
      const txs = mockTransactions.filter(t => {
        const d = new Date(t.occurred_on)
        return t.status === 'completed' && t.type !== 'transfer' && d >= start && d <= end
      })
      setStats(computeStats(txs as Transaction[]))
      setLoading(false)
      return
    }

    // With Supabase, reuse existing pattern
    setLoading(false)
  }, [month])

  return { stats, loading }
}

function computeStats(txs: Transaction[]): TransactionStats {
  const totalIncome   = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount,          0)
  const totalExpense  = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const pendingCount  = txs.filter(t => t.status === 'pending').length

  // Category breakdown (expenses only)
  const byCat: Record<string, { amount: number; name: string; color: string }> = {}
  txs
    .filter(t => t.amount < 0 && t.category_id)
    .forEach(t => {
      const cid  = t.category_id!
      const cat  = mockCategories.find(c => c.id === cid)
      const name = cat?.name ?? 'Outros'
      const color= cat?.color ?? '#8490b0'
      if (!byCat[cid]) byCat[cid] = { amount: 0, name, color }
      byCat[cid].amount += Math.abs(t.amount)
    })

  const topCatEntry = Object.values(byCat).sort((a, b) => b.amount - a.amount)[0]

  return {
    totalIncome,
    totalExpense,
    netBalance:       totalIncome - totalExpense,
    transactionCount: txs.length,
    pendingCount,
    topCategory: topCatEntry
      ? { name: topCatEntry.name, amount: topCatEntry.amount, color: topCatEntry.color }
      : null,
  }
}
