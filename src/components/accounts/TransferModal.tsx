import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRightLeft, CheckCircle2, ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Account } from '@/types/database'

interface TransferModalProps {
  fromAccount: Account | null
  accounts: Account[]
  open: boolean
  onClose: () => void
  onConfirm: (fromId: string, toId: string, amount: number, description: string) => Promise<void>
}

export default function TransferModal({ fromAccount, accounts, open, onClose, onConfirm }: TransferModalProps) {
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const available = accounts.filter(a => a.id !== fromAccount?.id)
  const toAccount = accounts.find(a => a.id === toAccountId)

  const handleClose = () => {
    if (loading) return
    setAmount('')
    setDescription('')
    setToAccountId('')
    setDone(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromAccount || !toAccountId || !amount || Number(amount) <= 0) return
    setLoading(true)
    try {
      await onConfirm(fromAccount.id, toAccountId, Number(amount.replace(',', '.')), description || 'Transferência')
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
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <CheckCircle2 size={52} style={{ color: '#00cce8' }} />
                  </motion.div>
                  <div className="mt-4 font-semibold text-base" style={{ color: '#e6e8f0' }}>Transferência realizada!</div>
                  <div className="mt-1 text-sm" style={{ color: '#444c6a' }}>
                    {formatCurrency(Number(amount.replace(',', '.')))} transferido para {toAccount?.name}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1c1f3244' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: 'rgba(0,204,232,0.1)', border: '1px solid rgba(0,204,232,0.2)' }}>
                        <ArrowRightLeft size={18} style={{ color: '#00cce8' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>Transferir</div>
                        <div className="text-xs" style={{ color: '#444c6a' }}>De: {fromAccount?.name}</div>
                      </div>
                    </div>
                    <button onClick={handleClose} style={{ color: '#444c6a' }}>
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Conta destino</label>
                      <div className="relative">
                        <select
                          style={{ ...inputStyle, appearance: 'none', paddingRight: 36 }}
                          value={toAccountId}
                          onChange={e => setToAccountId(e.target.value)}
                          required
                        >
                          <option value="" disabled>Selecionar conta...</option>
                          {available.map(a => (
                            <option key={a.id} value={a.id} style={{ background: '#0c0d18' }}>{a.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} style={{ color: '#444c6a', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>
                        Valor (R$)
                        {fromAccount && (
                          <span className="ml-2 font-normal" style={{ color: '#444c6a' }}>
                            Disponível: {formatCurrency(fromAccount.available_balance)}
                          </span>
                        )}
                      </label>
                      <input
                        style={inputStyle}
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={fromAccount?.available_balance}
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
                        placeholder="Ex: Pagamento, reserva..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#1c1f32', color: '#8490b0' }}>
                        Cancelar
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        disabled={loading || !toAccountId || !amount || Number(amount) <= 0}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #00cce8, #0099b3)',
                          color: '#06060a',
                          opacity: (!toAccountId || !amount || Number(amount) <= 0) ? 0.5 : 1,
                        }}
                      >
                        {loading ? 'Processando...' : 'Confirmar Transferência'}
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
