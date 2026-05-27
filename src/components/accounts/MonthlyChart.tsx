import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrencyCompact } from '@/lib/utils'
import { mockMonthlyData } from '@/data/mock'

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 shadow-2xl" style={{ background: '#13152a', border: '1px solid #1c1f32', minWidth: 160 }}>
      <div className="text-xs font-semibold mb-2" style={{ color: '#8490b0' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: '#8490b0' }}>{p.name === 'income' ? 'Entradas' : 'Saídas'}</span>
          </div>
          <span className="font-bold tabular-nums" style={{ color: '#e6e8f0' }}>
            {formatCurrencyCompact(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MonthlyChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
    >
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #1c1f3244' }}>
        <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>Entradas por Mês</div>
        <div className="text-xs mt-0.5" style={{ color: '#444c6a' }}>Últimos 6 meses</div>
      </div>

      <div className="px-4 pb-4 pt-2" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockMonthlyData} barCategoryGap="30%" barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#1c1f3250"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#444c6a', fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#444c6a', fontSize: 10 }}
              tickFormatter={formatCurrencyCompact}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
            <Bar dataKey="income" name="income" fill="#00d87f" radius={[5, 5, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" name="expense" fill="#ff3860" radius={[5, 5, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-6 pb-4">
        <div className="flex items-center gap-2 text-xs" style={{ color: '#8490b0' }}>
          <div className="w-3 h-1.5 rounded-full" style={{ background: '#00d87f' }} />
          Entradas
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: '#8490b0' }}>
          <div className="w-3 h-1.5 rounded-full" style={{ background: '#ff3860' }} />
          Saídas
        </div>
      </div>
    </motion.div>
  )
}
