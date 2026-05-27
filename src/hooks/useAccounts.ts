import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { mockAccounts } from '@/data/mock'
import type { Account } from '@/types/database'

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

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const totalAvailable = accounts.reduce((sum, a) => sum + a.available_balance, 0)

  async function deposit(accountId: string, amount: number, description: string) {
    if (!isSupabaseConfigured) {
      setAccounts(prev =>
        prev.map(a =>
          a.id === accountId
            ? { ...a, balance: a.balance + amount, available_balance: a.available_balance + amount }
            : a
        )
      )
      return
    }
    const account = accounts.find(a => a.id === accountId)
    if (!account) return
    await db.from('accounts').update({
      balance: account.balance + amount,
      available_balance: account.available_balance + amount,
    }).eq('id', accountId)
    await db.from('transactions').insert({
      account_id: accountId,
      description,
      amount,
      type: 'income',
      status: 'completed',
      occurred_on: new Date().toISOString().split('T')[0],
    })
    await fetchAccounts()
  }

  async function transfer(fromId: string, toId: string, amount: number, description: string) {
    if (!isSupabaseConfigured) {
      setAccounts(prev =>
        prev.map(a => {
          if (a.id === fromId) return { ...a, balance: a.balance - amount, available_balance: a.available_balance - amount }
          if (a.id === toId) return { ...a, balance: a.balance + amount, available_balance: a.available_balance + amount }
          return a
        })
      )
      return
    }
    const from = accounts.find(a => a.id === fromId)
    const to = accounts.find(a => a.id === toId)
    if (!from || !to) return
    await Promise.all([
      db.from('accounts').update({ balance: from.balance - amount, available_balance: from.available_balance - amount }).eq('id', fromId),
      db.from('accounts').update({ balance: to.balance + amount, available_balance: to.available_balance + amount }).eq('id', toId),
      db.from('transactions').insert([
        { account_id: fromId, destination_account_id: toId, description, amount: -amount, type: 'transfer', status: 'completed', occurred_on: new Date().toISOString().split('T')[0] },
        { account_id: toId, destination_account_id: fromId, description, amount, type: 'transfer', status: 'completed', occurred_on: new Date().toISOString().split('T')[0] },
      ]),
    ])
    await fetchAccounts()
  }

  async function createAccount(data: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    if (!isSupabaseConfigured) {
      const newAcc: Account = { ...data, id: crypto.randomUUID(), user_id: 'u1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      setAccounts(prev => [...prev, newAcc])
      return
    }
    await db.from('accounts').insert(data)
    await fetchAccounts()
  }

  return { accounts, loading, error, totalBalance, totalAvailable, deposit, transfer, createAccount, refetch: fetchAccounts }
}
