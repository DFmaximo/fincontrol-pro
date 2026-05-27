import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccounts } from '@/hooks/useAccounts'
import { mockCategories } from '@/data/mock'
import type { TransactionFilters, TransactionType, TransactionStatus, TransactionSource } from '../types'
import { TRANSACTION_TYPE_META, TRANSACTION_STATUS_META, TRANSACTION_SOURCE_META } from '../types'

interface Props {
  filters: TransactionFilters
  setFilter: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => void
  clearFilters: () => void
  activeCount: number
}

function Chip({
  label, active, color, onClick,
}: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
      style={{
        background: active ? `${color}18` : 'transparent',
        border:     `1px solid ${active ? color + '44' : '#1c1f32'}`,
        color:      active ? color : '#8490b0',
      }}
    >
      {label}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#2a3050' }}>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#08090f',
  border: '1px solid #1c1f32',
  borderRadius: 10,
  color: '#e6e8f0',
  padding: '8px 12px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
}

export default function TransactionFiltersPanel({ filters, setFilter, clearFilters, activeCount }: Props) {
  const { accounts } = useAccounts()

  return (
    <div
      className="rounded-2xl overflow-hidden flex-shrink-0"
      style={{
        background: '#0c0d18',
        border: '1px solid #1c1f32',
        width: 260,
        minWidth: 260,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #1c1f3244' }}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} style={{ color: '#00d87f' }} />
          <span className="text-sm font-semibold" style={{ color: '#e6e8f0' }}>Filtros</span>
          {activeCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: '#00d87f20', color: '#00d87f', border: '1px solid #00d87f33' }}
            >
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs transition-colors"
            style={{ color: '#444c6a' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff3860')}
            onMouseLeave={e => (e.currentTarget.style.color = '#444c6a')}
          >
            Limpar
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>

        {/* Search */}
        <div>
          <SectionLabel>Buscar</SectionLabel>
          <input
            style={inputStyle}
            type="text"
            placeholder="Descrição..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>

        {/* Date range */}
        <div>
          <SectionLabel>Período</SectionLabel>
          <div className="space-y-2">
            <input
              style={inputStyle}
              type="date"
              value={filters.dateFrom}
              onChange={e => setFilter('dateFrom', e.target.value)}
            />
            <input
              style={inputStyle}
              type="date"
              value={filters.dateTo}
              onChange={e => setFilter('dateTo', e.target.value)}
            />
          </div>
        </div>

        {/* Type */}
        <div>
          <SectionLabel>Tipo</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TRANSACTION_TYPE_META) as TransactionType[]).map(t => (
              <Chip
                key={t}
                label={TRANSACTION_TYPE_META[t].label}
                active={filters.type === t}
                color={TRANSACTION_TYPE_META[t].color}
                onClick={() => setFilter('type', filters.type === t ? '' : t)}
              />
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <SectionLabel>Status</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TRANSACTION_STATUS_META) as TransactionStatus[]).map(s => (
              <Chip
                key={s}
                label={TRANSACTION_STATUS_META[s].label}
                active={filters.status === s}
                color={TRANSACTION_STATUS_META[s].color}
                onClick={() => setFilter('status', filters.status === s ? '' : s)}
              />
            ))}
          </div>
        </div>

        {/* Source */}
        <div>
          <SectionLabel>Origem</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TRANSACTION_SOURCE_META) as TransactionSource[]).map(s => (
              <Chip
                key={s}
                label={TRANSACTION_SOURCE_META[s].label}
                active={filters.source === s}
                color={TRANSACTION_SOURCE_META[s].color}
                onClick={() => setFilter('source', filters.source === s ? '' : s)}
              />
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <SectionLabel>Conta</SectionLabel>
          <div className="relative">
            <select
              style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
              value={filters.accountId}
              onChange={e => setFilter('accountId', e.target.value)}
            >
              <option value="">Todas as contas</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id} style={{ background: '#0c0d18' }}>{a.name}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{ color: '#444c6a', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Category */}
        <div>
          <SectionLabel>Categoria</SectionLabel>
          <div className="relative">
            <select
              style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
              value={filters.categoryId}
              onChange={e => setFilter('categoryId', e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {mockCategories.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#0c0d18' }}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{ color: '#444c6a', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Amount range */}
        <div>
          <SectionLabel>Valor</SectionLabel>
          <div className="space-y-2">
            <input
              style={inputStyle}
              type="number"
              placeholder="Mín (R$)"
              value={filters.minAmount}
              onChange={e => setFilter('minAmount', e.target.value)}
            />
            <input
              style={inputStyle}
              type="number"
              placeholder="Máx (R$)"
              value={filters.maxAmount}
              onChange={e => setFilter('maxAmount', e.target.value)}
            />
          </div>
        </div>

        {/* Recurrent */}
        <div>
          <SectionLabel>Recorrência</SectionLabel>
          <div className="flex gap-1.5">
            <Chip label="Todos" active={filters.isRecurring === null} color="#8490b0" onClick={() => setFilter('isRecurring', null)} />
            <Chip label="Recorrente" active={filters.isRecurring === true} color="#00cce8" onClick={() => setFilter('isRecurring', true)} />
            <Chip label="Avulso" active={filters.isRecurring === false} color="#8490b0" onClick={() => setFilter('isRecurring', false)} />
          </div>
        </div>
      </div>
    </div>
  )
}
