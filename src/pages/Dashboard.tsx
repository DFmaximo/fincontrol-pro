import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, CreditCard, Target, Zap, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/utils'
import { mockMonthlyData } from '@/data/mock'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts'

function StatCard({ title, value, sub, color, icon, positive, delay = 0 }: {
  title: string; value: string; sub: string; color: string; icon: React.ReactNode; positive?: boolean; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
    >
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl pointer-events-none" style={{ background: `${color}12`, transform: 'translate(30%, -30%)' }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 38, height: 38, background: `${color}14`, border: `1px solid ${color}28`, color }}>
            {icon}
          </div>
        </div>
        <div className="text-xs mb-1" style={{ color: '#444c6a' }}>{title}</div>
        <div className="text-xl font-bold tabular-nums mb-1" style={{ color: '#e6e8f0', letterSpacing: '-0.02em' }}>{value}</div>
        <div className="text-xs" style={{ color: positive ? '#00d87f' : '#8490b0' }}>{sub}</div>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const janMonth = useMemo(() => new Date(2024, 0, 1), [])
  const { totalBalance, totalAvailable } = useAccounts()
  const { totalIncome, totalExpense } = useTransactions({ month: janMonth })

  const balanceHistory = mockMonthlyData.map(d => ({ month: d.month, value: d.income - d.expense }))

  return (
    <div className="space-y-7">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#e6e8f0', letterSpacing: '-0.025em' }}>Dashboard</h1>
        <p className="text-sm mt-1.5" style={{ color: '#8490b0' }}>Visão geral das suas finanças</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Patrimônio Total" value={formatCurrency(totalBalance)} sub="Todas as contas" color="#00d87f" icon={<Wallet size={18} />} positive delay={0} />
        <StatCard title="Disponível" value={formatCurrency(totalAvailable)} sub="Saldo líquido" color="#00cce8" icon={<CreditCard size={18} />} positive delay={0.05} />
        <StatCard title="Entradas Jan" value={formatCurrency(totalIncome)} sub="+14.2% vs dez" color="#00d87f" icon={<TrendingUp size={18} />} positive delay={0.1} />
        <StatCard title="Saídas Jan" value={formatCurrency(totalExpense)} sub="-8.5% vs dez" color="#ff3860" icon={<TrendingDown size={18} />} delay={0.15} />
      </div>

      {/* Balance chart + quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        {/* Balance trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl overflow-hidden p-5"
          style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>Evolução do Patrimônio</div>
              <div className="text-xs mt-0.5" style={{ color: '#444c6a' }}>Resultado líquido mensal</div>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(0,216,127,0.1)', color: '#00d87f', border: '1px solid rgba(0,216,127,0.2)' }}>
              +12.4%
            </span>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceHistory}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d87f" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00d87f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#444c6a', fontSize: 11 }} dy={8} />
                <Tooltip
                  contentStyle={{ background: '#13152a', border: '1px solid #1c1f32', borderRadius: 10, color: '#e6e8f0', fontSize: 12 }}
                  formatter={(v) => [formatCurrency(v as number), 'Resultado']}
                />
                <Area type="monotone" dataKey="value" stroke="#00d87f" strokeWidth={2} fill="url(#balGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick navigation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1c1f3244' }}>
            <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>Acesso Rápido</div>
          </div>
          <div className="p-4 space-y-2">
            {[
              { label: 'Contas & Carteiras', to: '/contas', icon: <Wallet size={16} />, color: '#00d87f' },
              { label: 'Transações', to: '/transacoes', icon: <TrendingUp size={16} />, color: '#00cce8' },
              { label: 'Metas', to: '/metas', icon: <Target size={16} />, color: '#8b5cf6' },
              { label: 'Análise IA', to: '/analise-ia', icon: <Zap size={16} />, color: '#ffd60a' },
            ].map((item, i) => (
              <Link key={item.to} to={item.to}>
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.25 + i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                  style={{ color: '#8490b0' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#10121f')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 32, height: 32, background: `${item.color}14`, color: item.color }}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium flex-1" style={{ color: '#e6e8f0' }}>{item.label}</span>
                  <ArrowRight size={14} style={{ color: '#444c6a' }} />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
