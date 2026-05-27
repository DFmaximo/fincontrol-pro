import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Clock } from 'lucide-react'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import type { Transaction } from '@/types/database'

interface RecentTransactionsProps {
  transactions: Transaction[]
  loading: boolean
}

function TransactionIcon({ type, amount }: { type: string; amount: number }) {
  if (type === 'transfer') {
    return (
      <div className="flex items-center justify-center rounded-xl" style={{ width: 38, height: 38, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <ArrowLeftRight size={16} style={{ color: '#8b5cf6' }} />
      </div>
    )
  }
  if (amount > 0) {
    return (
      <div className="flex items-center justify-center rounded-xl" style={{ width: 38, height: 38, background: 'rgba(0,216,127,0.1)', border: '1px solid rgba(0,216,127,0.18)' }}>
        <ArrowDownLeft size={16} style={{ color: '#00d87f' }} />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center rounded-xl" style={{ width: 38, height: 38, background: 'rgba(255,56,96,0.1)', border: '1px solid rgba(255,56,96,0.18)' }}>
      <ArrowUpRight size={16} style={{ color: '#ff3860' }} />
    </div>
  )
}

export default function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
    >
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1c1f3244' }}>
        <div>
          <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>Movimentações Recentes</div>
          <div className="text-xs mt-0.5" style={{ color: '#444c6a' }}>Últimas transações efetivadas</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#444c6a' }}>
          <Clock size={12} />
          Atualizado agora
        </div>
      </div>

      {loading ? (
        <div className="flex-1 px-6 py-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="rounded-xl animate-pulse" style={{ width: 38, height: 38, background: '#1c1f32' }} />
              <div className="flex-1 space-y-2">
                <div className="rounded animate-pulse h-3" style={{ background: '#1c1f32', width: '60%' }} />
                <div className="rounded animate-pulse h-2.5" style={{ background: '#1c1f3280', width: '40%' }} />
              </div>
              <div className="rounded animate-pulse h-4" style={{ background: '#1c1f32', width: 80 }} />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <div className="text-4xl mb-3">💸</div>
          <div className="text-sm font-medium" style={{ color: '#8490b0' }}>Nenhuma movimentação</div>
          <div className="text-xs mt-1" style={{ color: '#444c6a' }}>As transações aparecerão aqui</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="flex items-center gap-4 px-6 py-4 transition-colors duration-100"
              style={{ borderBottom: i < transactions.length - 1 ? '1px solid #1c1f3233' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#10121f')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <TransactionIcon type={tx.type} amount={tx.amount} />

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: '#e6e8f0' }}>
                  {tx.description}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs truncate" style={{ color: '#444c6a' }}>
                    {tx.accounts?.name ?? 'Conta'}
                  </span>
                  {tx.categories && (
                    <>
                      <span style={{ color: '#1c1f32' }}>·</span>
                      <span className="text-xs truncate" style={{ color: '#444c6a' }}>
                        {tx.categories.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end flex-shrink-0 gap-1">
                <div
                  className="text-sm font-bold tabular-nums"
                  style={{ color: tx.amount > 0 ? '#00d87f' : '#ff3860' }}
                >
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </div>
                <div className="text-xs" style={{ color: '#444c6a' }}>
                  {formatDateShort(tx.occurred_on)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
