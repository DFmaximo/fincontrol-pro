import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowDownCircle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Account } from '@/types/database'

interface DepositModalProps {
  account: Account | null
  open: boolean
  onClose: () => void
  onConfirm: (accountId: string, amount: number, description: string) => Promise<void>
}

export default function DepositModal({ account, open, onClose, onConfirm }: DepositModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleClose = () => {
    if (loading) return
    setAmount('')
    setDescription('')
    setDone(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!account || !amount || Number(amount) <= 0) return
    setLoading(true)
    try {
      await onConfirm(account.id, Number(amount.replace(',', '.')), description || 'Depósito')
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />
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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <CheckCircle2 size={52} style={{ color: '#00d87f' }} />
                  </motion.div>
                  <div className="mt-4 font-semibold text-base" style={{ color: '#e6e8f0' }}>Depósito realizado!</div>
                  <div className="mt-1 text-sm" style={{ color: '#444c6a' }}>
                    {formatCurrency(Number(amount.replace(',', '.')))} adicionado em {account?.name}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1c1f3244' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: 'rgba(0,216,127,0.1)', border: '1px solid rgba(0,216,127,0.2)' }}>
                        <ArrowDownCircle size={18} style={{ color: '#00d87f' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>Depositar</div>
                        <div className="text-xs" style={{ color: '#444c6a' }}>{account?.name}</div>
                      </div>
                    </div>
                    <button onClick={handleClose} style={{ color: '#444c6a' }} className="hover:text-text transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Valor (R$)</label>
                      <input
                        style={inputStyle}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Descrição (opcional)</label>
                      <input
                        style={inputStyle}
                        type="text"
                        placeholder="Ex: Salário, Transferência recebida..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ background: '#1c1f32', color: '#8490b0' }}>
                        Cancelar
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        disabled={loading || !amount || Number(amount) <= 0}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: loading ? 'rgba(0,216,127,0.3)' : 'linear-gradient(135deg, #00d87f, #00a86b)',
                          color: '#06060a',
                          opacity: (!amount || Number(amount) <= 0) ? 0.5 : 1,
                        }}
                      >
                        {loading ? 'Processando...' : 'Confirmar Depósito'}
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
