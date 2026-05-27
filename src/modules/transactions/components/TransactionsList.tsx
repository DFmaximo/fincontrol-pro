import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, ArrowLeftRight, Sliders,
  CreditCard, CheckCircle2, Clock, XCircle,
  MoreHorizontal, Check, Ban, Trash2, Pencil,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '../types'
import {
  TRANSACTION_TYPE_META,
  TRANSACTION_STATUS_META,
  TRANSACTION_SOURCE_META,
} from '../types'

// ── Type icon ──────────────────────────────────────────────────
function TxIcon({ type, amount }: { type: string; amount: number }) {
  const meta = TRANSACTION_TYPE_META[type as keyof typeof TRANSACTION_TYPE_META]
  const color = meta?.color ?? (amount >= 0 ? '#00d87f' : '#ff3860')
  const Icon =
    type === 'income'       ? TrendingUp    :
    type === 'expense'      ? TrendingDown  :
    type === 'transfer'     ? ArrowLeftRight:
    type === 'adjustment'   ? Sliders       :
    type === 'card_payment' ? CreditCard    : TrendingUp

  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ width: 40, height: 40, background: `${color}12`, border: `1px solid ${color}22` }}
    >
      <Icon size={17} style={{ color }} />
    </div>
  )
}

// ── Status badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const meta = TRANSACTION_STATUS_META[status as keyof typeof TRANSACTION_STATUS_META]
  if (!meta) return null
  const Icon = status === 'completed' ? CheckCircle2 : status === 'pending' ? Clock : XCircle
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: meta.bgColor, color: meta.color, border: `1px solid ${meta.color}33` }}
    >
      <Icon size={10} />
      {meta.label}
    </span>
  )
}

// ── Source badge ───────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  const meta = TRANSACTION_SOURCE_META[source as keyof typeof TRANSACTION_SOURCE_META]
  if (!meta) return null
  return (
    <span className="text-[11px] font-medium" style={{ color: meta.color }}>
      {meta.label}
    </span>
  )
}

// ── Row actions ────────────────────────────────────────────────
function RowActions({
  tx,
  onEdit,
  onConfirm,
  onCancel,
  onDelete,
}: {
  tx: Transaction
  onEdit:    (tx: Transaction) => void
  onConfirm: (id: string) => void
  onCancel:  (id: string) => void
  onDelete:  (id: string) => void
}) {
  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      {tx.status === 'pending' && (
        <button
          title="Confirmar"
          onClick={() => onConfirm(tx.id)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: '#444c6a' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00d87f')}
          onMouseLeave={e => (e.currentTarget.style.color = '#444c6a')}
        >
          <Check size={14} />
        </button>
      )}
      <button
        title="Editar"
        onClick={() => onEdit(tx)}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: '#444c6a' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#00cce8')}
        onMouseLeave={e => (e.currentTarget.style.color = '#444c6a')}
      >
        <Pencil size={14} />
      </button>
      {tx.status !== 'cancelled' && (
        <button
          title="Cancelar"
          onClick={() => onCancel(tx.id)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: '#444c6a' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff9443')}
          onMouseLeave={e => (e.currentTarget.style.color = '#444c6a')}
        >
          <Ban size={14} />
        </button>
      )}
      <button
        title="Excluir"
        onClick={() => onDelete(tx.id)}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: '#444c6a' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#ff3860')}
        onMouseLeave={e => (e.currentTarget.style.color = '#444c6a')}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
interface Props {
  transactions: Transaction[]
  loading: boolean
  total: number
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  onEdit:    (tx: Transaction) => void
  onConfirm: (id: string) => void
  onCancel:  (id: string) => void
  onDelete:  (id: string) => void
}

const COL_HEADER = 'text-xs font-semibold tracking-wide uppercase py-3 px-4'

export default function TransactionsList({
  transactions, loading, total, page, totalPages,
  onPageChange, onEdit, onConfirm, onCancel, onDelete,
}: Props) {

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
    >
      {/* Table header */}
      <div style={{ borderBottom: '1px solid #1c1f32' }}>
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: 52 }}  /> {/* icon */}
            <col style={{ width: '30%' }} /> {/* description */}
            <col style={{ width: '14%' }} /> {/* category */}
            <col style={{ width: '14%' }} /> {/* account */}
            <col style={{ width: '10%' }} /> {/* date */}
            <col style={{ width: '8%'  }} /> {/* source */}
            <col style={{ width: '10%' }} /> {/* status */}
            <col style={{ width: '10%' }} /> {/* amount */}
            <col style={{ width: 120   }} /> {/* actions */}
          </colgroup>
          <thead>
            <tr>
              <th />
              <th className={COL_HEADER} style={{ color: '#444c6a', textAlign: 'left' }}>Descrição</th>
              <th className={COL_HEADER} style={{ color: '#444c6a', textAlign: 'left' }}>Categoria</th>
              <th className={COL_HEADER} style={{ color: '#444c6a', textAlign: 'left' }}>Conta</th>
              <th className={COL_HEADER} style={{ color: '#444c6a', textAlign: 'left' }}>Data</th>
              <th className={COL_HEADER} style={{ color: '#444c6a', textAlign: 'left' }}>Origem</th>
              <th className={COL_HEADER} style={{ color: '#444c6a', textAlign: 'left' }}>Status</th>
              <th className={COL_HEADER} style={{ color: '#444c6a', textAlign: 'right' }}>Valor</th>
              <th />
            </tr>
          </thead>
        </table>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 320 }}>
        {loading ? (
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: 52 }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%'  }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: 120   }} />
            </colgroup>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1c1f3222' }}>
                  <td className="px-4 py-3.5">
                    <div className="rounded-xl animate-pulse" style={{ width: 40, height: 40, background: '#1c1f32' }} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="rounded animate-pulse h-3.5 mb-2" style={{ background: '#1c1f32', width: '70%' }} />
                    <div className="rounded animate-pulse h-2.5"   style={{ background: '#1c1f3266', width: '40%' }} />
                  </td>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="rounded animate-pulse h-3" style={{ background: '#1c1f32', width: '60%' }} />
                    </td>
                  ))}
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm font-medium" style={{ color: '#8490b0' }}>Nenhuma transação encontrada</div>
            <div className="text-xs mt-1" style={{ color: '#444c6a' }}>Tente ajustar os filtros ou adicionar uma nova transação</div>
          </div>
        ) : (
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: 52 }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%'  }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: 120   }} />
            </colgroup>
            <tbody>
              <AnimatePresence>
                {transactions.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, delay: i < 10 ? i * 0.03 : 0 }}
                    className="group transition-colors"
                    style={{
                      borderBottom: '1px solid #1c1f3222',
                      opacity: tx.status === 'cancelled' ? 0.45 : 1,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#10121f')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Icon */}
                    <td className="pl-4 py-3.5">
                      <TxIcon type={tx.type} amount={tx.amount} />
                    </td>

                    {/* Description + recurring badge */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: '#e6e8f0', maxWidth: 220 }}
                          title={tx.description}
                        >
                          {tx.description}
                        </span>
                        {tx.is_recurring && (
                          <RefreshCw size={10} style={{ color: '#00cce8', flexShrink: 0 }} />
                        )}
                      </div>
                      {tx.notes && (
                        <div className="text-xs mt-0.5 truncate" style={{ color: '#444c6a' }}>
                          {tx.notes}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      {tx.categories ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: tx.categories.color }}
                          />
                          <span className="text-sm truncate" style={{ color: '#8490b0' }}>
                            {tx.categories.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: '#2a3050' }}>—</span>
                      )}
                    </td>

                    {/* Account */}
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {tx.accounts && (
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tx.accounts.color }} />
                          )}
                          <span className="text-sm truncate" style={{ color: '#8490b0' }}>
                            {tx.accounts?.name ?? '—'}
                          </span>
                        </div>
                        {tx.type === 'transfer' && tx.destination_account && (
                          <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#444c6a' }}>
                            → {tx.destination_account.name}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm tabular-nums" style={{ color: '#8490b0' }}>
                        {formatDate(tx.effective_date ?? tx.occurred_on)}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3.5">
                      <SourceBadge source={tx.source ?? 'manual'} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={tx.status} />
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{
                          color: tx.type === 'transfer'
                            ? '#8b5cf6'
                            : tx.amount >= 0 ? '#00d87f' : '#ff3860',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="pr-4 py-3.5 text-right">
                      <RowActions
                        tx={tx}
                        onEdit={onEdit}
                        onConfirm={onConfirm}
                        onCancel={onCancel}
                        onDelete={onDelete}
                      />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Footer: count + pagination */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderTop: '1px solid #1c1f3244' }}
      >
        <span className="text-xs" style={{ color: '#444c6a' }}>
          {loading ? '…' : `${total} transações`}
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
              style={{ color: '#8490b0' }}
              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.color = '#e6e8f0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8490b0')}
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs px-2" style={{ color: '#8490b0' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
              style={{ color: '#8490b0' }}
              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.color = '#e6e8f0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8490b0')}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
