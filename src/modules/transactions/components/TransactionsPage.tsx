import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import { formatMonthYear, addMonths } from '@/lib/utils'
import { useTransactions }      from '../hooks/useTransactions'
import { useTransactionFilters } from '../hooks/useTransactionFilters'
import { useTransactionStats }  from '../hooks/useTransactionStats'
import TransactionStats         from './TransactionStats'
import TransactionFiltersPanel  from './TransactionFiltersPanel'
import TransactionsList         from './TransactionsList'
import TransactionModal         from './TransactionModal'
import MonthlyEvolution         from './MonthlyEvolution'
import type { Transaction }     from '../types'

export default function TransactionsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 0, 1))
  const [editTarget,   setEditTarget]   = useState<Transaction | null>(null)
  const [modalOpen,    setModalOpen]    = useState(false)

  const { filters, setFilter, clearFilters, activeCount, filtersOpen, setFiltersOpen } =
    useTransactionFilters()

  // Build month-range filter when no custom date range is set
  const effectiveFilters = useMemo(() => {
    if (filters.dateFrom || filters.dateTo) return filters
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const end   = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    return {
      ...filters,
      dateFrom: start.toISOString().split('T')[0],
      dateTo:   end.toISOString().split('T')[0],
    }
  }, [filters, currentMonth])

  const { transactions, loading, total, page, totalPages, setPage, cancel, confirm, remove, refetch } =
    useTransactions(effectiveFilters)

  const { stats, loading: statsLoading } = useTransactionStats(currentMonth)

  const isCurrentMonth =
    currentMonth.getMonth() === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear()

  function openCreate() { setEditTarget(null); setModalOpen(true) }
  function openEdit(tx: Transaction) { setEditTarget(tx); setModalOpen(true) }

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#e6e8f0', letterSpacing: '-0.025em' }}
          >
            Transações
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#8490b0' }}>
            Histórico financeiro centralizado de todas as movimentações
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month navigator */}
          <div
            className="flex items-center gap-1 rounded-xl px-3 py-2"
            style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
          >
            <button
              onClick={() => setCurrentMonth(d => addMonths(d, -1))}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: '#8490b0' }}
            >
              <ChevronLeft size={14} />
            </button>
            <span
              className="text-sm font-medium px-1 capitalize"
              style={{ color: '#e6e8f0', minWidth: 130, textAlign: 'center' }}
            >
              {formatMonthYear(currentMonth)}
            </span>
            <button
              onClick={() => setCurrentMonth(d => addMonths(d, 1))}
              disabled={isCurrentMonth}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30"
              style={{ color: '#8490b0' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* New transaction */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, #00d87f, #00a86b)',
              color: '#06060a',
            }}
          >
            <Plus size={15} />
            Nova Transação
          </motion.button>
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <TransactionStats stats={stats} loading={statsLoading} />

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1" style={{ maxWidth: 380 }}>
          <Search size={14} style={{ color: '#444c6a', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar transações..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            className="w-full"
            style={{
              background: '#0c0d18',
              border: '1px solid #1c1f32',
              borderRadius: 12,
              color: '#e6e8f0',
              padding: '9px 12px 9px 34px',
              fontSize: 13.5,
              outline: 'none',
            }}
          />
          {filters.search && (
            <button
              onClick={() => setFilter('search', '')}
              className="absolute right-10 top-1/2 -translate-y-1/2"
              style={{ color: '#444c6a' }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Toggle filters panel */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setFiltersOpen(o => !o)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: filtersOpen ? 'rgba(0,216,127,0.08)' : '#0c0d18',
            border:     `1px solid ${filtersOpen ? 'rgba(0,216,127,0.25)' : '#1c1f32'}`,
            color:      filtersOpen ? '#00d87f' : '#8490b0',
          }}
        >
          <SlidersHorizontal size={14} />
          Filtros
          {activeCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: '#00d87f22', color: '#00d87f' }}
            >
              {activeCount}
            </span>
          )}
        </motion.button>

        <div className="flex-1" />

        <span className="text-xs" style={{ color: '#444c6a' }}>
          {loading ? '…' : `${total} resultado${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Main body: filters + list ── */}
      <div className="flex gap-5 items-start">
        {/* Filters panel (collapsible) */}
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <TransactionFiltersPanel
              filters={filters}
              setFilter={setFilter}
              clearFilters={clearFilters}
              activeCount={activeCount}
            />
          </motion.div>
        )}

        {/* List */}
        <div className="flex-1 min-w-0 space-y-5">
          <TransactionsList
            transactions={transactions}
            loading={loading}
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onEdit={openEdit}
            onConfirm={confirm}
            onCancel={cancel}
            onDelete={remove}
          />

          {/* Monthly chart below the list */}
          <MonthlyEvolution />
        </div>
      </div>

      {/* ── Modal ── */}
      <TransactionModal
        open={modalOpen}
        transaction={editTarget}
        onClose={() => setModalOpen(false)}
        onSaved={() => refetch()}
      />
    </div>
  )
}
