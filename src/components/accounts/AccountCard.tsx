import { motion } from 'framer-motion'
import { Wallet, CreditCard, Building2, Landmark, PiggyBank, Plus, ArrowDownCircle, ArrowRightLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Account } from '@/types/database'

const ICONS: Record<string, React.ReactNode> = {
  wallet: <Wallet size={20} />,
  'credit-card': <CreditCard size={20} />,
  'building-2': <Building2 size={20} />,
  landmark: <Landmark size={20} />,
  piggy: <PiggyBank size={20} />,
}

interface AccountCardProps {
  account: Account
  onDeposit: (account: Account) => void
  onTransfer: (account: Account) => void
  index: number
}

export function AccountCard({ account, onDeposit, onTransfer, index }: AccountCardProps) {
  const icon = ICONS[account.icon] ?? <Wallet size={20} />

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: '#0c0d18',
        border: '1px solid #1c1f32',
        minHeight: 230,
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${account.color}, ${account.color}66)` }} />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{
                width: 40, height: 40,
                background: `${account.color}18`,
                border: `1px solid ${account.color}33`,
                color: account.color,
              }}
            >
              {icon}
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>
                {account.name}
              </div>
              <div className="text-xs mt-0.5 capitalize" style={{ color: '#444c6a' }}>
                {account.type === 'cash' ? 'Dinheiro' :
                  account.type === 'digital' ? 'Banco Digital' :
                  account.type === 'bank' ? 'Banco Tradicional' :
                  account.type === 'investment' ? 'Investimento' : account.type}
              </div>
            </div>
          </div>
          <div
            className="w-2 h-2 rounded-full mt-1.5 animate-pulse-dot"
            style={{ background: account.color }}
          />
        </div>

        {/* Balances */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="text-xs mb-1" style={{ color: '#444c6a' }}>Saldo Total</div>
            <div
              className="text-xl font-bold tabular-nums"
              style={{ color: '#e6e8f0', letterSpacing: '-0.02em' }}
            >
              {formatCurrency(account.balance)}
            </div>
          </div>
          {account.available_balance !== account.balance && (
            <div>
              <div className="text-xs mb-0.5" style={{ color: '#444c6a' }}>Disponível</div>
              <div className="text-sm font-semibold tabular-nums" style={{ color: account.color }}>
                {formatCurrency(account.available_balance)}
              </div>
            </div>
          )}
          {account.available_balance === account.balance && (
            <div>
              <div className="text-xs mb-0.5" style={{ color: '#444c6a' }}>Disponível</div>
              <div className="text-sm font-semibold tabular-nums" style={{ color: '#00d87f' }}>
                {formatCurrency(account.available_balance)}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1" style={{ borderTop: '1px solid #1c1f3266' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onDeposit(account)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
            style={{
              background: `${account.color}14`,
              border: `1px solid ${account.color}28`,
              color: account.color,
            }}
          >
            <ArrowDownCircle size={13} />
            Depositar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTransfer(account)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
            style={{
              background: '#1c1f3244',
              border: '1px solid #1c1f32',
              color: '#8490b0',
            }}
          >
            <ArrowRightLeft size={13} />
            Transferir
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

interface NewAccountCardProps {
  onClick: () => void
  index: number
}

export function NewAccountCard({ onClick, index }: NewAccountCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -2, borderColor: '#00d87f44', transition: { duration: 0.2 } }}
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-2xl cursor-pointer group transition-all duration-200"
      style={{
        background: 'transparent',
        border: '2px dashed #1c1f32',
        minHeight: 230,
      }}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className="flex items-center justify-center rounded-2xl mb-3"
        style={{
          width: 48, height: 48,
          background: 'rgba(0,216,127,0.06)',
          border: '1px solid rgba(0,216,127,0.15)',
        }}
      >
        <Plus size={22} style={{ color: '#00d87f' }} />
      </motion.div>
      <div className="text-sm font-semibold" style={{ color: '#8490b0' }}>Nova Conta</div>
      <div className="text-xs mt-1" style={{ color: '#444c6a' }}>Adicionar carteira</div>
    </motion.div>
  )
}
