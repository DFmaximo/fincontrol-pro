import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Scale, Clock, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { TransactionStats } from '../types'

interface Props {
  stats: TransactionStats | null
  loading: boolean
}

interface CardDef {
  key:     string
  label:   string
  getValue: (s: TransactionStats) => string
  getSub:   (s: TransactionStats) => string
  color:   string
  icon:    React.ReactNode
  positive?: boolean
}

const CARDS: CardDef[] = [
  {
    key: 'income',
    label:    'Receitas do Mês',
    getValue: s => formatCurrency(s.totalIncome),
    getSub:   s => `${s.transactionCount} transações`,
    color:    '#00d87f',
    icon:     <TrendingUp size={18} />,
    positive: true,
  },
  {
    key: 'expense',
    label:    'Despesas do Mês',
    getValue: s => formatCurrency(s.totalExpense),
    getSub:   s => `${s.pendingCount} pendentes`,
    color:    '#ff3860',
    icon:     <TrendingDown size={18} />,
  },
  {
    key: 'net',
    label:    'Saldo Líquido',
    getValue: s => formatCurrency(s.netBalance),
    getSub:   s => s.netBalance >= 0 ? 'Positivo' : 'Negativo',
    color:    '#00cce8',
    icon:     <Scale size={18} />,
    positive: true,
  },
  {
    key: 'top',
    label:    'Maior Categoria',
    getValue: s => s.topCategory ? s.topCategory.name : '—',
    getSub:   s => s.topCategory ? formatCurrency(s.topCategory.amount) : 'Sem dados',
    color:    '#8b5cf6',
    icon:     <Tag size={18} />,
  },
]

export default function TransactionStats({ stats, loading }: Props) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="relative rounded-2xl p-5 overflow-hidden"
          style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
        >
          {/* Ambient glow */}
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none"
            style={{ background: `${card.color}12`, transform: 'translate(30%,-30%)' }}
          />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: 38, height: 38,
                  background: `${card.color}14`,
                  border: `1px solid ${card.color}28`,
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
              {loading && (
                <div className="h-2 w-16 rounded animate-pulse" style={{ background: '#1c1f32' }} />
              )}
            </div>

            <div className="text-xs mb-1.5" style={{ color: '#444c6a' }}>{card.label}</div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-6 w-28 rounded animate-pulse" style={{ background: '#1c1f32' }} />
                <div className="h-3 w-20 rounded animate-pulse" style={{ background: '#1c1f3266' }} />
              </div>
            ) : (
              <>
                <div
                  className="text-xl font-bold tabular-nums"
                  style={{
                    color: stats && card.key === 'net' && stats.netBalance < 0 ? '#ff3860' : '#e6e8f0',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stats ? card.getValue(stats) : '—'}
                </div>
                <div className="text-xs mt-1" style={{ color: '#444c6a' }}>
                  {stats ? card.getSub(stats) : ''}
                </div>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
