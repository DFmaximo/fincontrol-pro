import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface ComingSoonProps {
  title: string
  description: string
  icon: LucideIcon
  color?: string
}

export default function ComingSoon({ title, description, icon: Icon, color = '#00d87f' }: ComingSoonProps) {
  return (
    <div className="space-y-7">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#e6e8f0', letterSpacing: '-0.025em' }}>{title}</h1>
        <p className="text-sm mt-1.5" style={{ color: '#8490b0' }}>{description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-col items-center justify-center rounded-2xl py-24"
        style={{ background: '#0c0d18', border: '1px dashed #1c1f32' }}
      >
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-full blur-xl"
            style={{ background: `${color}20`, transform: 'scale(2)' }}
          />
          <div
            className="relative flex items-center justify-center rounded-2xl"
            style={{ width: 72, height: 72, background: `${color}14`, border: `1px solid ${color}28` }}
          >
            <Icon size={32} style={{ color }} />
          </div>
        </div>
        <div className="text-base font-semibold mb-2" style={{ color: '#e6e8f0' }}>Em desenvolvimento</div>
        <div className="text-sm text-center max-w-xs" style={{ color: '#8490b0' }}>
          Este módulo está sendo construído e estará disponível em breve.
        </div>
        <div
          className="mt-6 px-4 py-2 rounded-xl text-xs font-semibold"
          style={{ background: `${color}12`, border: `1px solid ${color}22`, color }}
        >
          Em breve
        </div>
      </motion.div>
    </div>
  )
}
