import { useState, useCallback, useMemo } from 'react'
import type { TransactionFilters } from '../types'
import { DEFAULT_FILTERS } from '../types'

export function useTransactionFilters() {
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const setFilter = useCallback(
    <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }))
    },
    [],
  )

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const activeCount = useMemo(() => {
    let n = 0
    if (filters.search)      n++
    if (filters.dateFrom)    n++
    if (filters.dateTo)      n++
    if (filters.type)        n++
    if (filters.status)      n++
    if (filters.source)      n++
    if (filters.accountId)   n++
    if (filters.categoryId)  n++
    if (filters.minAmount)   n++
    if (filters.maxAmount)   n++
    if (filters.isRecurring !== null) n++
    return n
  }, [filters])

  return {
    filters,
    setFilter,
    clearFilters,
    activeCount,
    filtersOpen,
    setFiltersOpen,
  }
}
