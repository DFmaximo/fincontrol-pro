import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Wallet, CreditCard, Building2, Landmark, PiggyBank } from 'lucide-react'
import type { Account, AccountType } from '@/types/database'

interface NewAccountModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (data: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>
}

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: React.ReactNode }[] = [
  { value: 'cash', label: 'Dinheiro', icon: <Wallet size={16} /> },
  { value: 'digital', label: 'Banco Digital', icon: <CreditCard size={16} /> },
  { value: 'bank', label: 'Banco Tradicional', icon: <Building2 size={16} /> },
  { value: 'investment', label: 'Investimento', icon: <Landmark size={16} /> },
  { value: 'credit', label: 'Poupança', icon: <PiggyBank size={16} /> },
]

const ICON_MAP: Record<AccountType, string> = {
  cash: 'wallet', digital: 'credit-card', bank: 'building-2', investment: 'landmark', credit: 'piggy',
}

const COLORS = ['#00d87f', '#00cce8', '#8b5cf6', '#ff3860', '#ff9443', '#ffd60a', '#ec4899']

export default function NewAccountModal({ open, onClose, onConfirm }: NewAccountModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('bank')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleClose = () => {
    if (loading) return
    setName(''); setType('bank'); setBalance(''); setColor(COLORS[0]); setDone(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    setLoading(true)
    try {
      const bal = Number(balance.replace(',', '.')) || 0
      await onConfirm({
        name, type, color,
        icon: ICON_MAP[type],
        balance: bal,
        available_balance: bal,
        currency: 'BRL',
        is_active: true,
      })
      setDone(true)
      setTimeout(handleClose, 1400)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#08090f',
    border: '1px solid #1c1f32',
    borderRadius: 10,
    color: '#e6e8f0',
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
            >
              {done ? (
                <div className="flex flex-col items-center justify-center py-14 px-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <CheckCircle2 size={52} style={{ color: '#00d87f' }} />
                  </motion.div>
                  <div className="mt-4 font-semibold text-base" style={{ color: '#e6e8f0' }}>Conta criada!</div>
                  <div className="mt-1 text-sm" style={{ color: '#444c6a' }}>{name} adicionada com sucesso</div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1c1f3244' }}>
                    <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>Nova Conta</div>
                    <button onClick={handleClose} style={{ color: '#444c6a' }}><X size={18} /></button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Nome da conta</label>
                      <input style={inputStyle} type="text" placeholder="Ex: Nubank, Carteira..." value={name} onChange={e => setName(e.target.value)} required autoFocus />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Tipo</label>
                      <div className="grid grid-cols-3 gap-2">
                        {ACCOUNT_TYPES.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setType(t.value)}
                            className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                            style={{
                              background: type === t.value ? `${color}18` : '#08090f',
                              border: `1px solid ${type === t.value ? color + '44' : '#1c1f32'}`,
                              color: type === t.value ? color : '#8490b0',
                            }}
                          >
                            {t.icon}
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Cor</label>
                      <div className="flex gap-2">
                        {COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className="rounded-full transition-all"
                            style={{
                              width: 26, height: 26,
                              background: c,
                              border: color === c ? `2px solid white` : '2px solid transparent',
                              transform: color === c ? 'scale(1.2)' : 'scale(1)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Saldo inicial (R$)</label>
                      <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0,00" value={balance} onChange={e => setBalance(e.target.value)} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#1c1f32', color: '#8490b0' }}>Cancelar</button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading || !name} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)`, color: '#06060a', opacity: !name ? 0.5 : 1 }}>
                        {loading ? 'Criando...' : 'Criar Conta'}
                      </motion.button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
