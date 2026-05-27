import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts'
import { formatCurrencyCompact, formatCurrency } from '@/lib/utils'
import { mockMonthlyData } from '@/data/mock'

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 shadow-2xl" style={{ background: '#13152a', border: '1px solid #1c1f32', minWidth: 170 }}>
      <div className="text-xs font-semibold mb-2" style={{ color: '#8490b0' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-5 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: '#8490b0' }}>{p.name === 'income' ? 'Entradas' : 'Saídas'}</span>
          </div>
          <span className="font-bold tabular-nums" style={{ color: '#e6e8f0' }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-2 pt-2 flex items-center justify-between text-xs" style={{ borderTop: '1px solid #1c1f32' }}>
          <span style={{ color: '#8490b0' }}>Líquido</span>
          <span
            className="font-bold tabular-nums"
            style={{ color: payload[0].value - payload[1].value >= 0 ? '#00d87f' : '#ff3860' }}
          >
            {formatCurrency(payload[0].value - payload[1].value)}
          </span>
        </div>
      )}
    </div>
  )
}

export default function MonthlyEvolution() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
    >
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1c1f3244' }}>
        <div>
          <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>Evolução Mensal</div>
          <div className="text-xs mt-0.5" style={{ color: '#444c6a' }}>Entradas vs saídas — últimos 6 meses</div>
        </div>
        <div className="flex gap-4">
          {[
            { label: 'Entradas', color: '#00d87f' },
            { label: 'Saídas',   color: '#ff3860' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: '#8490b0' }}>
              <div className="w-3 h-1.5 rounded-full" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 pt-3" style={{ height: 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockMonthlyData} barCategoryGap="30%" barGap={3}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c1f3240" />
            <XAxis
              dataKey="month"
              axisLine={false} tickLine={false}
              tick={{ fill: '#444c6a', fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false} tickLine={false}
              tick={{ fill: '#444c6a', fontSize: 10 }}
              tickFormatter={formatCurrencyCompact}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)', radius: 6 }} />
            <Bar dataKey="income"  name="income"  fill="#00d87f" radius={[5,5,0,0]} maxBarSize={32} />
            <Bar dataKey="expense" name="expense" fill="#ff3860" radius={[5,5,0,0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
