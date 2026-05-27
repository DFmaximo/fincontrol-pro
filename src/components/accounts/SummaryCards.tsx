import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SummaryCardsProps {
  totalBalance: number
  totalAvailable: number
  totalIncome: number
  totalExpense: number
}

interface CardData {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  glow: string
  positive?: boolean
}

export default function SummaryCards({ totalBalance, totalAvailable, totalIncome, totalExpense }: SummaryCardsProps) {
  const cards: CardData[] = [
    {
      title: 'Saldo Total',
      value: totalBalance,
      icon: <Wallet size={18} />,
      color: '#00d87f',
      glow: 'rgba(0,216,127,0.12)',
      positive: true,
    },
    {
      title: 'Disponível',
      value: totalAvailable,
      icon: <DollarSign size={18} />,
      color: '#00cce8',
      glow: 'rgba(0,204,232,0.12)',
      positive: true,
    },
    {
      title: 'Entradas no Mês',
      value: totalIncome,
      icon: <TrendingUp size={18} />,
      color: '#00d87f',
      glow: 'rgba(0,216,127,0.12)',
      positive: true,
    },
    {
      title: 'Saídas no Mês',
      value: totalExpense,
      icon: <TrendingDown size={18} />,
      color: '#ff3860',
      glow: 'rgba(255,56,96,0.12)',
      positive: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="relative rounded-2xl overflow-hidden p-5"
          style={{
            background: '#0c0d18',
            border: '1px solid #1c1f32',
          }}
        >
          {/* Glow bg */}
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none"
            style={{ background: card.glow, transform: 'translate(30%, -30%)' }}
          />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 36, height: 36,
                  background: `${card.color}14`,
                  border: `1px solid ${card.color}28`,
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
            </div>
            <div className="text-xs mb-1.5" style={{ color: '#444c6a' }}>
              {card.title}
            </div>
            <div
              className="text-xl font-bold tabular-nums"
              style={{ color: card.positive ? '#e6e8f0' : '#ff3860', letterSpacing: '-0.02em' }}
            >
              {!card.positive && card.value > 0 ? '- ' : ''}
              {formatCurrency(card.value)}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
