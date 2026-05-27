import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { mockMonthlyData } from '@/data/mock'

export default function MonthlyInsights() {
  const current = mockMonthlyData[mockMonthlyData.length - 1]
  const previous = mockMonthlyData[mockMonthlyData.length - 2]

  const incomeDiff = current.income - previous.income
  const expenseDiff = current.expense - previous.expense
  const balanceDiff = (current.income - current.expense) - (previous.income - previous.expense)
  const incomeChange = ((incomeDiff / previous.income) * 100).toFixed(1)
  const expenseChange = ((expenseDiff / previous.expense) * 100).toFixed(1)

  const insights = [
    {
      label: 'vs mês anterior',
      title: incomeDiff >= 0 ? `Receita subiu ${incomeChange}%` : `Receita caiu ${Math.abs(Number(incomeChange))}%`,
      sub: `${incomeDiff >= 0 ? '+' : ''}${formatCurrency(incomeDiff)} em entradas`,
      icon: incomeDiff >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
      color: incomeDiff >= 0 ? '#00d87f' : '#ff3860',
      bg: incomeDiff >= 0 ? 'rgba(0,216,127,0.08)' : 'rgba(255,56,96,0.08)',
      border: incomeDiff >= 0 ? 'rgba(0,216,127,0.18)' : 'rgba(255,56,96,0.18)',
    },
    {
      label: 'vs mês anterior',
      title: expenseDiff <= 0 ? `Despesas caíram ${Math.abs(Number(expenseChange))}%` : `Despesas subiram ${expenseChange}%`,
      sub: `${expenseDiff >= 0 ? '+' : ''}${formatCurrency(expenseDiff)} em saídas`,
      icon: expenseDiff <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />,
      color: expenseDiff <= 0 ? '#00d87f' : '#ff3860',
      bg: expenseDiff <= 0 ? 'rgba(0,216,127,0.08)' : 'rgba(255,56,96,0.08)',
      border: expenseDiff <= 0 ? 'rgba(0,216,127,0.18)' : 'rgba(255,56,96,0.18)',
    },
    {
      label: 'resultado líquido',
      title: balanceDiff >= 0 ? 'Saldo líquido cresceu' : 'Saldo líquido caiu',
      sub: `${balanceDiff >= 0 ? '+' : ''}${formatCurrency(balanceDiff)} no período`,
      icon: balanceDiff >= 0 ? <Zap size={14} /> : <Minus size={14} />,
      color: balanceDiff >= 0 ? '#00cce8' : '#ff9443',
      bg: balanceDiff >= 0 ? 'rgba(0,204,232,0.08)' : 'rgba(255,148,67,0.08)',
      border: balanceDiff >= 0 ? 'rgba(0,204,232,0.18)' : 'rgba(255,148,67,0.18)',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
    >
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #1c1f3244' }}>
        <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>Comparativo Mensal</div>
        <div className="text-xs mt-0.5" style={{ color: '#444c6a' }}>
          {current.month} vs {previous.month}
        </div>
      </div>

      <div className="p-5 space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.3 + i * 0.07 }}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: insight.bg, border: `1px solid ${insight.border}` }}
          >
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 30, height: 30, background: `${insight.color}20`, color: insight.color }}
            >
              {insight.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: '#e6e8f0' }}>
                {insight.title}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: '#444c6a' }}>
                {insight.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
