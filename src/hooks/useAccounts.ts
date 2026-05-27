import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { mockAccounts } from '@/data/mock'
import type { Account } from '@/types/database'
import {
  recordDeposit,
  recordTransfer,
} from '@/modules/transactions/services/transactionService'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setAccounts(mockAccounts)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const { data, error } = await db
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      if (error) throw error
      setAccounts((data as Account[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const channel = supabase
      .channel('accounts-realtime')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'accounts' }, fetchAccounts)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAccounts])

  const totalBalance   = accounts.reduce((sum, a) => sum + a.balance, 0)
  const totalAvailable = accounts.reduce((sum, a) => sum + a.available_balance, 0)

  /** Deposit / credit — routed through transaction service so every movement is recorded */
  async function deposit(accountId: string, amount: number, description: string) {
    if (!isSupabaseConfigured) {
      // Mock: optimistic update
      setAccounts(prev =>
        prev.map(a =>
          a.id === accountId
            ? { ...a, balance: a.balance + amount, available_balance: a.available_balance + amount }
            : a
        )
      )
      return
    }
    await recordDeposit({
      accountId,
      amount,
      description,
      effectiveDate: new Date().toISOString().split('T')[0],
      source: 'accounts',
    })
    await fetchAccounts()
  }

  /** Transfer between accounts — routed through transaction service (creates linked pair) */
  async function transfer(fromId: string, toId: string, amount: number, description: string) {
    if (!isSupabaseConfigured) {
      // Mock: optimistic update
      setAccounts(prev =>
        prev.map(a => {
          if (a.id === fromId) return { ...a, balance: a.balance - amount, available_balance: a.available_balance - amount }
          if (a.id === toId)   return { ...a, balance: a.balance + amount, available_balance: a.available_balance + amount }
          return a
        })
      )
      return
    }
    await recordTransfer({
      fromAccountId: fromId,
      toAccountId:   toId,
      amount,
      description,
      effectiveDate: new Date().toISOString().split('T')[0],
    })
    await fetchAccounts()
  }

  async function createAccount(data: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    if (!isSupabaseConfigured) {
      const newAcc: Account = {
        ...data,
        id:         crypto.randomUUID(),
        user_id:    'u1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setAccounts(prev => [...prev, newAcc])
      return
    }
    await db.from('accounts').insert(data)
    await fetchAccounts()
  }

  return {
    accounts,
    loading,
    error,
    totalBalance,
    totalAvailable,
    deposit,
    transfer,
    createAccount,
    refetch: fetchAccounts,
  }
}
