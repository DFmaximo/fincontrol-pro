import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, RefreshCw, ChevronDown } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { mockCategories } from '@/data/mock'
import { isSupabaseConfigured } from '@/lib/supabase'
import { createTransaction, updateTransaction } from '../services/transactionService'
import type {
  Transaction, TransactionType, TransactionStatus,
  TransactionSource, RecurrenceFrequency,
} from '../types'
import { TRANSACTION_TYPE_META } from '../types'

interface Props {
  open: boolean
  transaction?: Transaction | null   // null = create mode
  onClose: () => void
  onSaved: () => void
}

const FIELD: React.CSSProperties = {
  background: '#08090f',
  border: '1px solid #1c1f32',
  borderRadius: 10,
  color: '#e6e8f0',
  padding: '9px 13px',
  fontSize: 13.5,
  width: '100%',
  outline: 'none',
}

const TYPES: TransactionType[] = ['income', 'expense', 'transfer', 'adjustment', 'card_payment']

export default function TransactionModal({ open, transaction, onClose, onSaved }: Props) {
  const { accounts } = useAccounts()
  const isEdit = Boolean(transaction)

  const [type,        setType]        = useState<TransactionType>('expense')
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [accountId,   setAccountId]   = useState('')
  const [destAccId,   setDestAccId]   = useState('')
  const [categoryId,  setCategoryId]  = useState('')
  const [status,      setStatus]      = useState<TransactionStatus>('completed')
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0])
  const [notes,       setNotes]       = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency,   setFrequency]   = useState<RecurrenceFrequency>('monthly')
  const [loading,     setLoading]     = useState(false)
  const [done,        setDone]        = useState(false)

  // Populate fields in edit mode
  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setDescription(transaction.description)
      setAmount(String(Math.abs(transaction.amount)))
      setAccountId(transaction.account_id)
      setDestAccId(transaction.destination_account_id ?? '')
      setCategoryId(transaction.category_id ?? '')
      setStatus(transaction.status)
      setDate(transaction.effective_date ?? transaction.occurred_on)
      setNotes(transaction.notes ?? '')
      setIsRecurring(transaction.is_recurring)
    } else {
      reset()
    }
  }, [transaction, open])

  function reset() {
    setType('expense'); setDescription(''); setAmount(''); setAccountId('')
    setDestAccId(''); setCategoryId(''); setStatus('completed')
    setDate(new Date().toISOString().split('T')[0])
    setNotes(''); setIsRecurring(false); setFrequency('monthly')
    setDone(false)
  }

  function handleClose() {
    if (loading) return
    reset(); onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description || !amount || !accountId) return
    setLoading(true)

    try {
      const sign = (type === 'expense' || type === 'card_payment') ? -1 : 1
      const finalAmount = Number(amount.replace(',', '.')) * sign

      const payload = {
        account_id:             accountId,
        destination_account_id: type === 'transfer' ? destAccId || null : null,
        category_id:            categoryId || null,
        description,
        amount:                 finalAmount,
        type,
        status,
        source:                 'manual' as TransactionSource,
        effective_date:         date,
        is_recurring:           isRecurring,
        recurring_frequency:    isRecurring ? frequency : undefined,
        notes:                  notes || null,
      }

      if (!isSupabaseConfigured) {
        // Mock mode: just close and trigger refetch
      } else if (isEdit && transaction) {
        await updateTransaction(transaction.id, payload)
      } else {
        await createTransaction(payload)
      }

      setDone(true)
      setTimeout(() => { handleClose(); onSaved() }, 1200)
    } finally {
      setLoading(false)
    }
  }

  const typeMeta = TRANSACTION_TYPE_META[type]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full rounded-2xl overflow-hidden"
              style={{ background: '#0c0d18', border: '1px solid #1c1f32', maxWidth: 520 }}
            >
              {done ? (
                <div className="flex flex-col items-center justify-center py-14 px-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280 }}>
                    <CheckCircle2 size={52} style={{ color: typeMeta.color }} />
                  </motion.div>
                  <div className="mt-4 font-semibold" style={{ color: '#e6e8f0' }}>
                    {isEdit ? 'Transação atualizada!' : 'Transação criada!'}
                  </div>
                </div>
              ) : (
                <>
                  {/* Modal header */}
                  <div
                    className="flex items-center justify-between px-6 py-5"
                    style={{ borderBottom: '1px solid #1c1f3244' }}
                  >
                    <div>
                      <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>
                        {isEdit ? 'Editar Transação' : 'Nova Transação'}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#444c6a' }}>
                        Preencha os dados da movimentação
                      </div>
                    </div>
                    <button onClick={handleClose} style={{ color: '#444c6a' }}>
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Type selector */}
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Tipo</label>
                      <div className="flex flex-wrap gap-2">
                        {TYPES.map(t => {
                          const m = TRANSACTION_TYPE_META[t]
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setType(t)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                              style={{
                                background: type === t ? `${m.color}18` : 'transparent',
                                border:     `1px solid ${type === t ? m.color + '44' : '#1c1f32'}`,
                                color:      type === t ? m.color : '#8490b0',
                              }}
                            >
                              {m.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Description + Amount row */}
                    <div className="grid grid-cols-[1fr_160px] gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Descrição *</label>
                        <input
                          style={FIELD} type="text" required
                          placeholder="Ex: Salário, Aluguel..."
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Valor (R$) *</label>
                        <input
                          style={FIELD} type="number" step="0.01" min="0.01" required
                          placeholder="0,00"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Account + Destination (transfer) */}
                    <div className={type === 'transfer' ? 'grid grid-cols-2 gap-3' : ''}>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>
                          {type === 'transfer' ? 'Conta Origem *' : 'Conta *'}
                        </label>
                        <div className="relative">
                          <select
                            style={{ ...FIELD, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
                            value={accountId}
                            onChange={e => setAccountId(e.target.value)}
                            required
                          >
                            <option value="">Selecionar...</option>
                            {accounts.map(a => (
                              <option key={a.id} value={a.id} style={{ background: '#0c0d18' }}>{a.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={13} style={{ color: '#444c6a', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      </div>

                      {type === 'transfer' && (
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Conta Destino *</label>
                          <div className="relative">
                            <select
                              style={{ ...FIELD, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
                              value={destAccId}
                              onChange={e => setDestAccId(e.target.value)}
                              required
                            >
                              <option value="">Selecionar...</option>
                              {accounts.filter(a => a.id !== accountId).map(a => (
                                <option key={a.id} value={a.id} style={{ background: '#0c0d18' }}>{a.name}</option>
                              ))}
                            </select>
                            <ChevronDown size={13} style={{ color: '#444c6a', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Category + Date + Status */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Categoria</label>
                        <div className="relative">
                          <select
                            style={{ ...FIELD, appearance: 'none', paddingRight: 28, cursor: 'pointer' }}
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                          >
                            <option value="">—</option>
                            {mockCategories.map(c => (
                              <option key={c.id} value={c.id} style={{ background: '#0c0d18' }}>{c.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={13} style={{ color: '#444c6a', position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Data</label>
                        <input style={FIELD} type="date" value={date} onChange={e => setDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Status</label>
                        <div className="relative">
                          <select
                            style={{ ...FIELD, appearance: 'none', paddingRight: 28, cursor: 'pointer' }}
                            value={status}
                            onChange={e => setStatus(e.target.value as TransactionStatus)}
                          >
                            <option value="completed" style={{ background: '#0c0d18' }}>Confirmada</option>
                            <option value="pending"   style={{ background: '#0c0d18' }}>Pendente</option>
                          </select>
                          <ChevronDown size={13} style={{ color: '#444c6a', position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Observação</label>
                      <input
                        style={FIELD} type="text"
                        placeholder="Anotação opcional..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                      />
                    </div>

                    {/* Recurrence toggle */}
                    <div
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
                      style={{ background: isRecurring ? 'rgba(0,204,232,0.06)' : '#08090f', border: `1px solid ${isRecurring ? 'rgba(0,204,232,0.2)' : '#1c1f32'}` }}
                      onClick={() => setIsRecurring(r => !r)}
                    >
                      <div className="flex items-center gap-2.5">
                        <RefreshCw size={14} style={{ color: isRecurring ? '#00cce8' : '#444c6a' }} />
                        <span className="text-xs font-medium" style={{ color: isRecurring ? '#00cce8' : '#8490b0' }}>
                          Transação recorrente
                        </span>
                      </div>
                      <div
                        className="rounded-full transition-all duration-200"
                        style={{
                          width: 36, height: 20,
                          background: isRecurring ? '#00cce8' : '#1c1f32',
                          position: 'relative',
                        }}
                      >
                        <div
                          className="absolute top-0.5 rounded-full transition-all duration-200"
                          style={{
                            width: 16, height: 16,
                            background: 'white',
                            left: isRecurring ? 18 : 2,
                          }}
                        />
                      </div>
                    </div>

                    {isRecurring && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-xs font-medium mb-2" style={{ color: '#8490b0' }}>Frequência</label>
                        <div className="flex gap-2">
                          {(['weekly','monthly','yearly'] as RecurrenceFrequency[]).map(f => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setFrequency(f)}
                              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                              style={{
                                background: frequency === f ? 'rgba(0,204,232,0.12)' : 'transparent',
                                border:     `1px solid ${frequency === f ? 'rgba(0,204,232,0.3)' : '#1c1f32'}`,
                                color:      frequency === f ? '#00cce8' : '#8490b0',
                              }}
                            >
                              {f === 'weekly' ? 'Semanal' : f === 'monthly' ? 'Mensal' : 'Anual'}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                        style={{ background: '#1c1f32', color: '#8490b0' }}
                      >
                        Cancelar
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        disabled={loading || !description || !amount || !accountId}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${typeMeta.color}, ${typeMeta.color}bb)`,
                          color: '#06060a',
                          opacity: (!description || !amount || !accountId) ? 0.5 : 1,
                        }}
                      >
                        {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Transação'}
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
