import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { mockCards, mockInvoices } from '@/data/mock'
import type { Card, Invoice } from '@/types/cards'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export function useCards() {
  const [cards,    setCards]    = useState<Card[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setCards(mockCards)
      setInvoices(mockInvoices)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [cardsRes, invRes] = await Promise.all([
        db.from('cards').select('*').eq('is_active', true).order('created_at'),
        db.from('invoices').select('*').in('status', ['open', 'overdue']).order('due_date'),
      ])
      if (cardsRes.error) throw cardsRes.error
      if (invRes.error)   throw invRes.error
      setCards((cardsRes.data as Card[])   ?? [])
      setInvoices((invRes.data as Invoice[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cartões')
      // Fallback to mock
      setCards(mockCards)
      setInvoices(mockInvoices)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  /** Returns the open invoice for a given card (if any) */
  function getCardInvoice(cardId: string): Invoice | undefined {
    return invoices.find(i => i.card_id === cardId && (i.status === 'open' || i.status === 'overdue'))
  }

  /** Available limit for a card */
  function getAvailableLimit(cardId: string): number {
    const card = cards.find(c => c.id === cardId)
    return card?.available_limit ?? 0
  }

  return { cards, invoices, loading, error, getCardInvoice, getAvailableLimit, refetch: fetchAll }
}
