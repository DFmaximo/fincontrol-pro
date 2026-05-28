import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, RefreshCw, ChevronDown,
  CreditCard, Wallet, ArrowLeftRight, Calendar,
  Info, Layers, TrendingUp, TrendingDown,
} from 'lucide-react'
import { useAccounts }              from '@/hooks/useAccounts'
import { useCards }                 from '@/hooks/useCards'
import { mockCategories }           from '@/data/mock'
import { isSupabaseConfigured }     from '@/lib/supabase'
import { createTransaction, updateTransaction } from '../services/transactionService'
import { getInvoiceForDate, formatBrazilianDate } from '@/lib/invoiceUtils'
import { formatCurrency }           from '@/lib/utils'
import type {
  Transaction, TransactionType, TransactionStatus,
  TransactionSource, RecurrenceFrequency,
} from '../types'
import { TRANSACTION_TYPE_META } from '../types'

// ─── Shared styles ────────────────────────────────────────────
const F: React.CSSProperties = {
  background: '#08090f',
  border: '1px solid #1c1f32',
  borderRadius: 10,
  color: '#e6e8f0',
  padding: '9px 12px',
  fontSize: 13.5,
  width: '100%',
  outline: 'none',
}

// ─── Micro-components ─────────────────────────────────────────
function Lbl({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-xs font-medium mb-1.5" style={{ color: '#8490b0' }}>
      {children}{req && <span style={{ color: '#ff3860' }}> *</span>}
    </label>
  )
}

function Sel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={12}
        style={{ color: '#444c6a', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      />
    </div>
  )
}

function InfoBox({ icon: Icon, color, children }: {
  icon: React.ElementType; color: string; children: React.ReactNode
}) {
  return (
    <div
      className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
      style={{ background: `${color}08`, border: `1px solid ${color}1a`, color: '#8490b0' }}
    >
      <Icon size={12} style={{ color, flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  )
}

function SectionDivider({ icon: Icon, label, color }: {
  icon: React.ElementType; label: string; color: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={11} style={{ color }} />
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#444c6a' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: '#1c1f32' }} />
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  open: boolean
  transaction?: Transaction | null
  onClose: () => void
  onSaved: () => void
}

const TYPES: TransactionType[] = ['income', 'expense', 'transfer', 'adjustment', 'card_payment']
const INSTALL_PRESETS = [2, 3, 6, 10, 12, 18]

type PaymentMethod  = 'account' | 'card'
type AdjustDir      = 'credit' | 'debit'
type InstallMode    = 'total' | 'per_installment'

// ─── Main component ───────────────────────────────────────────
export default function TransactionModal({ open, transaction, onClose, onSaved }: Props) {
  const { accounts }                    = useAccounts()
  const { cards, getCardInvoice, getAvailableLimit } = useCards()
  const isEdit = Boolean(transaction)

  // ── Core fields ───────────────────────────────────────────
  const [type,        setType]        = useState<TransactionType>('expense')
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [accountId,   setAccountId]   = useState('')
  const [destAccId,   setDestAccId]   = useState('')
  const [categoryId,  setCategoryId]  = useState('')
  const [status,      setStatus]      = useState<TransactionStatus>('completed')
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0])
  const [notes,       setNotes]       = useState('')

  // ── Recurrence ────────────────────────────────────────────
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency,   setFrequency]   = useState<RecurrenceFrequency>('monthly')

  // ── Expense-specific ──────────────────────────────────────
  const [payMethod,      setPayMethod]      = useState<PaymentMethod>('account')
  const [cardId,         setCardId]         = useState('')
  const [isInstallment,  setIsInstallment]  = useState(false)
  const [installCount,   setInstallCount]   = useState(6)
  const [customInstall,  setCustomInstall]  = useState('')
  const [installMode,    setInstallMode]    = useState<InstallMode>('total')

  // ── Due date (vencimento) ─────────────────────────────────
  const [dueDate, setDueDate] = useState('')

  // ── Adjustment-specific ───────────────────────────────────
  const [adjDir, setAdjDir] = useState<AdjustDir>('debit')

  // ── Card payment ──────────────────────────────────────────
  const [payCardId,     setPayCardId]     = useState('')
  const [payFullInvoice, setPayFullInvoice] = useState(true)

  // ── Loading / success ─────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  // ── Derived ───────────────────────────────────────────────
  const parsedAmount   = parseFloat(amount.replace(',', '.')) || 0
  const effectiveCount = (customInstall ? parseInt(customInstall) : installCount) || 1

  const installmentAmt = useMemo(() => {
    if (!parsedAmount) return 0
    return installMode === 'total' ? parsedAmount / effectiveCount : parsedAmount
  }, [parsedAmount, effectiveCount, installMode])

  const installmentTotal = useMemo(() => {
    if (!parsedAmount) return 0
    return installMode === 'total' ? parsedAmount : parsedAmount * effectiveCount
  }, [parsedAmount, effectiveCount, installMode])

  const selectedCard    = cards.find(c => c.id === cardId)
  const selectedPayCard = cards.find(c => c.id === payCardId)
  const currentInvoice  = payCardId ? getCardInvoice(payCardId) : undefined
  const invoiceInfo     = selectedCard && date ? getInvoiceForDate(selectedCard, date) : null
  const availableLimit  = cardId ? getAvailableLimit(cardId) : 0

  const filteredCats = useMemo(() => {
    if (type === 'income')  return mockCategories.filter(c => c.type === 'income'  || c.type === 'both')
    if (type === 'expense') return mockCategories.filter(c => c.type === 'expense' || c.type === 'both')
    return []
  }, [type])

  // ── Validation ────────────────────────────────────────────
  const isValid = useMemo(() => {
    if (!description.trim() || !parsedAmount) return false
    switch (type) {
      case 'income':       return Boolean(accountId)
      case 'expense':      return payMethod === 'account' ? Boolean(accountId) : Boolean(cardId)
      case 'transfer':     return Boolean(accountId) && Boolean(destAccId) && accountId !== destAccId
      case 'adjustment':   return Boolean(accountId)
      case 'card_payment': return Boolean(payCardId) && Boolean(accountId) && parsedAmount > 0
    }
  }, [type, description, parsedAmount, accountId, destAccId, payMethod, cardId, payCardId])

  // ── Limit warning for card ────────────────────────────────
  const overLimit = payMethod === 'card' && parsedAmount > 0 && parsedAmount > availableLimit

  // ── Populate for edit ─────────────────────────────────────
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
      setDueDate(transaction.due_date ?? '')
      setIsRecurring(transaction.is_recurring)
    } else {
      resetForm()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction, open])

  // ── Auto-fill card payment amount ─────────────────────────
  useEffect(() => {
    if (type === 'card_payment' && currentInvoice && payFullInvoice) {
      const due = currentInvoice.total_amount - currentInvoice.paid_amount
      setAmount(due > 0 ? String(due) : '')
    }
  }, [type, currentInvoice, payFullInvoice, payCardId])

  // ── Auto-fill description for card payment ────────────────
  useEffect(() => {
    if (type === 'card_payment' && selectedPayCard && !isEdit) {
      setDescription(`Pagamento fatura ${selectedPayCard.name}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, payCardId])

  function resetForm() {
    setType('expense'); setDescription(''); setAmount(''); setAccountId('')
    setDestAccId(''); setCategoryId(''); setStatus('completed')
    setDate(new Date().toISOString().split('T')[0])
    setNotes(''); setIsRecurring(false); setFrequency('monthly')
    setPayMethod('account'); setCardId(''); setIsInstallment(false)
    setInstallCount(6); setCustomInstall(''); setInstallMode('total')
    setAdjDir('debit'); setPayCardId(''); setPayFullInvoice(true)
    setDueDate(''); setDone(false)
  }

  function handleClose() { if (!loading) { resetForm(); onClose() } }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || loading) return
    setLoading(true)

    try {
      // Determine sign and effective amount
      let sign = 1
      if (type === 'expense' || type === 'card_payment')      sign = -1
      if (type === 'adjustment' && adjDir === 'debit') sign = -1

      const effectiveAmount = parsedAmount * sign

      // For card expenses: pending status (doesn't affect bank balance)
      const effectiveStatus: TransactionStatus =
        (type === 'expense' && payMethod === 'card') ? 'pending' : status

      // For card expenses: use first account as placeholder (will be linked to card in v2)
      const effectiveAccountId =
        (type === 'expense' && payMethod === 'card')
          ? (accounts[0]?.id ?? accountId)
          : accountId

      const payload = {
        account_id:             effectiveAccountId,
        destination_account_id: type === 'transfer' ? (destAccId || null) : null,
        category_id:            categoryId || null,
        description,
        amount:                 effectiveAmount,
        type,
        status:                 effectiveStatus,
        source:                 (type === 'expense' && payMethod === 'card'
          ? 'cards'
          : 'manual') as TransactionSource,
        due_date:       dueDate || null,
        effective_date: date,
        is_recurring:   isRecurring && payMethod === 'account',
        recurring_frequency: isRecurring ? frequency : undefined,
        notes: [
          notes,
          (type === 'expense' && payMethod === 'card' && selectedCard)
            ? `Cartão: ${selectedCard.name} ••••${selectedCard.last_four}`
            : '',
          (type === 'expense' && payMethod === 'card' && isInstallment)
            ? `Parcelado: ${effectiveCount}× de ${formatCurrency(installmentAmt)}`
            : '',
          (type === 'expense' && payMethod === 'card' && invoiceInfo)
            ? `Fatura: ${invoiceInfo.label}`
            : '',
        ].filter(Boolean).join(' | ') || null,
      }

      if (!isSupabaseConfigured) {
        // Mock mode: just simulate success
        await new Promise(r => setTimeout(r, 600))
      } else if (isEdit && transaction) {
        await updateTransaction(transaction.id, payload)
      } else {
        await createTransaction(payload)
      }

      setDone(true)
      setTimeout(() => { handleClose(); onSaved() }, 1400)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const typeMeta = TRANSACTION_TYPE_META[type]

  // ─────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 28 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full rounded-2xl overflow-hidden my-auto"
              style={{ background: '#0c0d18', border: '1px solid #1c1f32', maxWidth: 590 }}
            >

              {/* ── Success screen ── */}
              {done ? (
                <div className="flex flex-col items-center justify-center py-16 px-8 gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  >
                    <CheckCircle2 size={58} style={{ color: typeMeta.color }} />
                  </motion.div>
                  <div className="font-semibold text-base" style={{ color: '#e6e8f0' }}>
                    {isEdit ? 'Transação atualizada!' : 'Registrado com sucesso!'}
                  </div>
                  <div className="text-sm text-center" style={{ color: '#444c6a', maxWidth: 280 }}>
                    {description}
                    {parsedAmount > 0 && ` · ${formatCurrency(parsedAmount)}`}
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Header ── */}
                  <div
                    className="flex items-center justify-between px-6 py-4"
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
                    <button
                      onClick={handleClose}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ color: '#444c6a' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* ── Form ── */}
                  <form
                    onSubmit={handleSubmit}
                    className="p-5 space-y-4 overflow-y-auto"
                    style={{ maxHeight: 'calc(100dvh - 160px)' }}
                  >

                    {/* ═══ TYPE TABS ═══ */}
                    <div className="flex flex-wrap gap-1.5">
                      {TYPES.map(t => {
                        const m = TRANSACTION_TYPE_META[t]
                        const active = type === t
                        return (
                          <button
                            key={t} type="button"
                            onClick={() => { setType(t); setCategoryId(''); setPayMethod('account') }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: active ? `${m.color}18` : 'transparent',
                              border:     `1px solid ${active ? m.color + '55' : '#1c1f32'}`,
                              color:      active ? m.color : '#8490b0',
                            }}
                          >
                            {m.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* ═══ DESCRIPTION + AMOUNT ═══ */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 150px' }}>
                      <div>
                        <Lbl req>Descrição</Lbl>
                        <input
                          style={F} type="text" required autoFocus
                          placeholder={
                            type === 'income'       ? 'Ex: Salário, Freelance...'    :
                            type === 'expense'      ? 'Ex: Supermercado, Netflix...' :
                            type === 'transfer'     ? 'Ex: Reserva mensal...'        :
                            type === 'adjustment'   ? 'Ex: Correção de saldo...'     :
                                                      'Ex: Fatura Nubank Fev...'
                          }
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                        />
                      </div>
                      <div>
                        <Lbl req={!(type === 'card_payment' && payFullInvoice && currentInvoice)}>
                          {type === 'card_payment' ? 'Valor a pagar' : 'Valor (R$)'}
                        </Lbl>
                        <div className="relative">
                          <span
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium select-none"
                            style={{ color: '#444c6a' }}
                          >R$</span>
                          <input
                            style={{ ...F, paddingLeft: 28 }}
                            type="number" step="0.01" min="0.01"
                            placeholder="0,00"
                            value={amount}
                            readOnly={type === 'card_payment' && payFullInvoice && Boolean(currentInvoice)}
                            onChange={e => setAmount(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════
                        INCOME
                    ═══════════════════════════════════════════ */}
                    {type === 'income' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Lbl req>Conta de entrada</Lbl>
                            <Sel>
                              <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                value={accountId} onChange={e => setAccountId(e.target.value)} required>
                                <option value="">Selecionar conta...</option>
                                {accounts.map(a => (
                                  <option key={a.id} value={a.id} style={{ background: '#0c0d18' }}>{a.name}</option>
                                ))}
                              </select>
                            </Sel>
                          </div>
                          <div>
                            <Lbl>Categoria</Lbl>
                            <Sel>
                              <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                                <option value="">Sem categoria</option>
                                {filteredCats.map(c => (
                                  <option key={c.id} value={c.id} style={{ background: '#0c0d18' }}>{c.name}</option>
                                ))}
                              </select>
                            </Sel>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Lbl>Data de recebimento</Lbl>
                            <input style={F} type="date" value={date} onChange={e => setDate(e.target.value)} />
                          </div>
                          <div>
                            <Lbl>Status</Lbl>
                            <Sel>
                              <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                value={status} onChange={e => setStatus(e.target.value as TransactionStatus)}>
                                <option value="completed" style={{ background: '#0c0d18' }}>✓ Confirmada</option>
                                <option value="pending"   style={{ background: '#0c0d18' }}>⏳ Pendente</option>
                              </select>
                            </Sel>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ═══════════════════════════════════════════
                        EXPENSE
                    ═══════════════════════════════════════════ */}
                    {type === 'expense' && (
                      <>
                        {/* Payment method toggle */}
                        <div>
                          <Lbl>Forma de pagamento</Lbl>
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              { v: 'account', Icon: Wallet,     label: 'Débito em conta'  },
                              { v: 'card',    Icon: CreditCard, label: 'Cartão de crédito' },
                            ] as { v: PaymentMethod; Icon: React.ElementType; label: string }[]).map(({ v, Icon, label }) => (
                              <button key={v} type="button"
                                onClick={() => setPayMethod(v)}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
                                style={{
                                  background: payMethod === v ? `${typeMeta.color}14` : 'transparent',
                                  border:     `1px solid ${payMethod === v ? typeMeta.color + '44' : '#1c1f32'}`,
                                  color:      payMethod === v ? typeMeta.color : '#8490b0',
                                }}
                              >
                                <Icon size={13} />{label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── Conta ── */}
                        {payMethod === 'account' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Lbl req>Conta</Lbl>
                              <Sel>
                                <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                  value={accountId} onChange={e => setAccountId(e.target.value)} required>
                                  <option value="">Selecionar...</option>
                                  {accounts.map(a => (
                                    <option key={a.id} value={a.id} style={{ background: '#0c0d18' }}>{a.name}</option>
                                  ))}
                                </select>
                              </Sel>
                            </div>
                            <div>
                              <Lbl>Categoria</Lbl>
                              <Sel>
                                <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                  value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                                  <option value="">Sem categoria</option>
                                  {filteredCats.map(c => (
                                    <option key={c.id} value={c.id} style={{ background: '#0c0d18' }}>{c.name}</option>
                                  ))}
                                </select>
                              </Sel>
                            </div>
                          </div>
                        )}

                        {/* ── Cartão ── */}
                        {payMethod === 'card' && (
                          <div className="space-y-3">
                            {/* Card selector */}
                            <div>
                              <Lbl req>Cartão</Lbl>
                              <Sel>
                                <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                  value={cardId} onChange={e => { setCardId(e.target.value); setIsInstallment(false) }} required>
                                  <option value="">Selecionar cartão...</option>
                                  {cards.map(c => (
                                    <option key={c.id} value={c.id} style={{ background: '#0c0d18' }}>
                                      {c.name} •••• {c.last_four}
                                      {' — Limite disponível: '}{formatCurrency(c.available_limit)}
                                    </option>
                                  ))}
                                </select>
                              </Sel>
                            </div>

                            {/* Limit warning */}
                            {overLimit && (
                              <InfoBox icon={Info} color="#ff3860">
                                Valor supera o limite disponível de {formatCurrency(availableLimit)} neste cartão.
                              </InfoBox>
                            )}

                            {/* ── Parcelamento ── */}
                            <div
                              className="rounded-xl p-4 space-y-3"
                              style={{ background: '#08090f', border: '1px solid #1c1f32' }}
                            >
                              <SectionDivider icon={Layers} label="Parcelamento" color="#8b5cf6" />

                              <div className="flex gap-2">
                                {[
                                  { v: false, label: 'À vista'   },
                                  { v: true,  label: 'Parcelado' },
                                ].map(opt => (
                                  <button key={String(opt.v)} type="button"
                                    onClick={() => setIsInstallment(opt.v)}
                                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                                    style={{
                                      background: isInstallment === opt.v ? 'rgba(139,92,246,0.12)' : 'transparent',
                                      border:     `1px solid ${isInstallment === opt.v ? 'rgba(139,92,246,0.4)' : '#1c1f32'}`,
                                      color:      isInstallment === opt.v ? '#8b5cf6' : '#8490b0',
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>

                              {isInstallment && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="space-y-3 overflow-hidden"
                                >
                                  {/* Preset count */}
                                  <div>
                                    <span className="text-xs" style={{ color: '#444c6a' }}>Nº de parcelas</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {INSTALL_PRESETS.map(n => {
                                        const sel = installCount === n && !customInstall
                                        return (
                                          <button key={n} type="button"
                                            onClick={() => { setInstallCount(n); setCustomInstall('') }}
                                            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                                            style={{
                                              background: sel ? 'rgba(139,92,246,0.12)' : 'transparent',
                                              border:     `1px solid ${sel ? 'rgba(139,92,246,0.4)' : '#1c1f32'}`,
                                              color:      sel ? '#8b5cf6' : '#8490b0',
                                            }}
                                          >{n}×</button>
                                        )
                                      })}
                                      <input
                                        type="number" min={2} max={48}
                                        placeholder="Outro"
                                        value={customInstall}
                                        onChange={e => setCustomInstall(e.target.value)}
                                        style={{ ...F, width: 64, padding: '4px 8px', fontSize: 12, textAlign: 'center' }}
                                      />
                                    </div>
                                  </div>

                                  {/* Value mode */}
                                  <div>
                                    <span className="text-xs" style={{ color: '#444c6a' }}>O valor digitado acima é</span>
                                    <div className="flex gap-2 mt-1.5">
                                      {([
                                        { v: 'total',           label: 'Total da compra'   },
                                        { v: 'per_installment', label: 'Valor por parcela' },
                                      ] as { v: InstallMode; label: string }[]).map(opt => (
                                        <button key={opt.v} type="button"
                                          onClick={() => setInstallMode(opt.v)}
                                          className="flex-1 py-1.5 rounded-lg text-xs transition-all"
                                          style={{
                                            background: installMode === opt.v ? 'rgba(139,92,246,0.1)' : 'transparent',
                                            border:     `1px solid ${installMode === opt.v ? 'rgba(139,92,246,0.35)' : '#1c1f32'}`,
                                            color:      installMode === opt.v ? '#8b5cf6' : '#8490b0',
                                          }}
                                        >{opt.label}</button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Calculated summary */}
                                  {parsedAmount > 0 && effectiveCount > 1 && (
                                    <div
                                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs"
                                      style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}
                                    >
                                      <div className="flex flex-col gap-0.5">
                                        <span style={{ color: '#444c6a' }}>Cada parcela</span>
                                        <span className="font-bold text-sm" style={{ color: '#8b5cf6' }}>
                                          {formatCurrency(installmentAmt)}
                                        </span>
                                      </div>
                                      <div style={{ color: '#1c1f32', fontSize: 18 }}>×</div>
                                      <div className="flex flex-col gap-0.5 text-right">
                                        <span style={{ color: '#444c6a' }}>Total</span>
                                        <span className="font-bold text-sm" style={{ color: '#e6e8f0' }}>
                                          {formatCurrency(installmentTotal)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </div>

                            {/* ── Fatura panel ── */}
                            {invoiceInfo && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl p-4 space-y-2"
                                style={{ background: '#08090f', border: '1px solid rgba(0,204,232,0.15)' }}
                              >
                                <SectionDivider icon={Calendar} label="Fatura" color="#00cce8" />
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>
                                    {invoiceInfo.label}
                                  </span>
                                  {isInstallment && effectiveCount > 1 && (
                                    <span
                                      className="text-xs px-2 py-0.5 rounded-full"
                                      style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}
                                    >
                                      {effectiveCount}× parcelas
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-5 text-xs" style={{ color: '#444c6a' }}>
                                  <span>Fecha {formatBrazilianDate(invoiceInfo.closingDate)}</span>
                                  <span>Vence {formatBrazilianDate(invoiceInfo.dueDate)}</span>
                                </div>
                                {isInstallment && effectiveCount > 1 && (
                                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#444c6a' }}>
                                    <Info size={11} style={{ color: '#00cce8' }} />
                                    As demais parcelas serão lançadas nas faturas seguintes automaticamente.
                                  </div>
                                )}
                              </motion.div>
                            )}

                            {/* Category */}
                            <div>
                              <Lbl>Categoria</Lbl>
                              <Sel>
                                <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                  value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                                  <option value="">Sem categoria</option>
                                  {filteredCats.map(c => (
                                    <option key={c.id} value={c.id} style={{ background: '#0c0d18' }}>{c.name}</option>
                                  ))}
                                </select>
                              </Sel>
                            </div>
                          </div>
                        )}

                        {/* Date + Due date + Status */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Lbl>{payMethod === 'card' ? 'Data da compra' : 'Data da despesa'}</Lbl>
                            <input style={F} type="date" value={date} onChange={e => setDate(e.target.value)} />
                          </div>
                          <div>
                            <Lbl>Vencimento</Lbl>
                            <input
                              style={{ ...F, borderColor: dueDate && new Date(dueDate + 'T12:00:00') < new Date() ? '#ff386044' : '#1c1f32' }}
                              type="date"
                              value={dueDate}
                              onChange={e => setDueDate(e.target.value)}
                              placeholder="Opcional"
                            />
                          </div>
                          <div>
                            <Lbl>Status</Lbl>
                            <Sel>
                              <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                value={payMethod === 'card' ? 'pending' : status}
                                disabled={payMethod === 'card'}
                                onChange={e => setStatus(e.target.value as TransactionStatus)}>
                                <option value="completed" style={{ background: '#0c0d18' }}>✓ Confirmada</option>
                                <option value="pending"   style={{ background: '#0c0d18' }}>⏳ Pendente</option>
                              </select>
                            </Sel>
                          </div>
                        </div>

                        {/* Card info note */}
                        {payMethod === 'card' && (
                          <InfoBox icon={Info} color="#00cce8">
                            Compras no cartão ficam com status Pendente e não reduzem seu saldo bancário.
                            O saldo é impactado apenas ao pagar a fatura.
                          </InfoBox>
                        )}
                      </>
                    )}

                    {/* ═══════════════════════════════════════════
                        TRANSFER
                    ═══════════════════════════════════════════ */}
                    {type === 'transfer' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Lbl req>Conta origem</Lbl>
                            <Sel>
                              <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                value={accountId} onChange={e => setAccountId(e.target.value)} required>
                                <option value="">Selecionar...</option>
                                {accounts.map(a => (
                                  <option key={a.id} value={a.id} style={{ background: '#0c0d18' }}>{a.name}</option>
                                ))}
                              </select>
                            </Sel>
                          </div>
                          <div>
                            <Lbl req>Conta destino</Lbl>
                            <Sel>
                              <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                value={destAccId} onChange={e => setDestAccId(e.target.value)} required>
                                <option value="">Selecionar...</option>
                                {accounts.filter(a => a.id !== accountId).map(a => (
                                  <option key={a.id} value={a.id} style={{ background: '#0c0d18' }}>{a.name}</option>
                                ))}
                              </select>
                            </Sel>
                            {destAccId && destAccId === accountId && (
                              <p className="text-xs mt-1" style={{ color: '#ff3860' }}>
                                Deve ser diferente da conta origem
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <Lbl>Data da transferência</Lbl>
                          <input style={F} type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <InfoBox icon={ArrowLeftRight} color="#8b5cf6">
                          Transferências movem valor entre suas contas sem alterar o saldo global. Nenhuma
                          duplicidade é criada — apenas duas entradas espelhadas vinculadas.
                        </InfoBox>
                      </>
                    )}

                    {/* ═══════════════════════════════════════════
                        ADJUSTMENT
                    ═══════════════════════════════════════════ */}
                    {type === 'adjustment' && (
                      <>
                        <div>
                          <Lbl>Tipo de ajuste</Lbl>
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              { v: 'credit', Icon: TrendingUp,   label: '+ Crédito',  color: '#00d87f' },
                              { v: 'debit',  Icon: TrendingDown, label: '− Débito',   color: '#ff3860' },
                            ] as { v: AdjustDir; Icon: React.ElementType; label: string; color: string }[]).map(
                              ({ v, Icon, label, color }) => (
                                <button key={v} type="button"
                                  onClick={() => setAdjDir(v)}
                                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
                                  style={{
                                    background: adjDir === v ? `${color}14` : 'transparent',
                                    border:     `1px solid ${adjDir === v ? color + '44' : '#1c1f32'}`,
                                    color:      adjDir === v ? color : '#8490b0',
                                  }}
                                >
                                  <Icon size={13} />{label}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Lbl req>Conta</Lbl>
                            <Sel>
                              <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                value={accountId} onChange={e => setAccountId(e.target.value)} required>
                                <option value="">Selecionar...</option>
                                {accounts.map(a => (
                                  <option key={a.id} value={a.id} style={{ background: '#0c0d18' }}>{a.name}</option>
                                ))}
                              </select>
                            </Sel>
                          </div>
                          <div>
                            <Lbl>Data</Lbl>
                            <input style={F} type="date" value={date} onChange={e => setDate(e.target.value)} />
                          </div>
                        </div>
                      </>
                    )}

                    {/* ═══════════════════════════════════════════
                        CARD PAYMENT
                    ═══════════════════════════════════════════ */}
                    {type === 'card_payment' && (
                      <>
                        {/* Card selector */}
                        <div>
                          <Lbl req>Cartão</Lbl>
                          <Sel>
                            <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                              value={payCardId} onChange={e => setPayCardId(e.target.value)} required>
                              <option value="">Selecionar cartão...</option>
                              {cards.map(c => (
                                <option key={c.id} value={c.id} style={{ background: '#0c0d18' }}>
                                  {c.name} •••• {c.last_four}
                                </option>
                              ))}
                            </select>
                          </Sel>
                        </div>

                        {/* Current invoice panel */}
                        {selectedPayCard && (
                          <div
                            className="rounded-xl p-4 space-y-3"
                            style={{ background: '#08090f', border: '1px solid rgba(0,204,232,0.15)' }}
                          >
                            <SectionDivider icon={CreditCard} label="Fatura em aberto" color="#00cce8" />
                            {currentInvoice ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold text-sm" style={{ color: '#e6e8f0' }}>
                                      {new Date(currentInvoice.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ color: '#444c6a' }}>
                                      Vence {formatBrazilianDate(currentInvoice.due_date)}
                                      {' · Fecha '}{formatBrazilianDate(currentInvoice.closing_date)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-base tabular-nums" style={{ color: '#ff3860' }}>
                                      {formatCurrency(currentInvoice.total_amount - currentInvoice.paid_amount)}
                                    </div>
                                    {currentInvoice.paid_amount > 0 && (
                                      <div className="text-xs" style={{ color: '#00d87f' }}>
                                        Pago: {formatCurrency(currentInvoice.paid_amount)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {([
                                    { v: true,  label: 'Pagar total'         },
                                    { v: false, label: 'Valor personalizado' },
                                  ] as { v: boolean; label: string }[]).map(opt => (
                                    <button key={String(opt.v)} type="button"
                                      onClick={() => setPayFullInvoice(opt.v)}
                                      className="flex-1 py-1.5 rounded-lg text-xs transition-all"
                                      style={{
                                        background: payFullInvoice === opt.v ? 'rgba(0,204,232,0.1)' : 'transparent',
                                        border:     `1px solid ${payFullInvoice === opt.v ? 'rgba(0,204,232,0.35)' : '#1c1f32'}`,
                                        color:      payFullInvoice === opt.v ? '#00cce8' : '#8490b0',
                                      }}
                                    >{opt.label}</button>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs py-2 text-center" style={{ color: '#444c6a' }}>
                                Nenhuma fatura em aberto para este cartão.
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Lbl req>Conta pagadora</Lbl>
                            <Sel>
                              <select style={{ ...F, appearance: 'none', paddingRight: 30 }}
                                value={accountId} onChange={e => setAccountId(e.target.value)} required>
                                <option value="">Selecionar...</option>
                                {accounts.map(a => (
                                  <option key={a.id} value={a.id} style={{ background: '#0c0d18' }}>{a.name}</option>
                                ))}
                              </select>
                            </Sel>
                          </div>
                          <div>
                            <Lbl>Data do pagamento</Lbl>
                            <input style={F} type="date" value={date} onChange={e => setDate(e.target.value)} />
                          </div>
                        </div>
                      </>
                    )}

                    {/* ═══════════════════════════════════════════
                        NOTES — all types
                    ═══════════════════════════════════════════ */}
                    <div>
                      <Lbl>Observação</Lbl>
                      <input
                        style={F} type="text"
                        placeholder="Anotação opcional..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                      />
                    </div>

                    {/* ═══════════════════════════════════════════
                        RECURRENCE — income, expense (conta), adjustment
                    ═══════════════════════════════════════════ */}
                    {(type === 'income'
                      || (type === 'expense' && payMethod === 'account')
                      || type === 'adjustment') && (
                      <>
                        <div
                          className="flex items-center justify-between p-3 rounded-xl cursor-pointer select-none transition-colors"
                          style={{
                            background: isRecurring ? 'rgba(0,204,232,0.05)' : '#08090f',
                            border:     `1px solid ${isRecurring ? 'rgba(0,204,232,0.2)' : '#1c1f32'}`,
                          }}
                          onClick={() => setIsRecurring(r => !r)}
                        >
                          <div className="flex items-center gap-2.5">
                            <RefreshCw size={13} style={{ color: isRecurring ? '#00cce8' : '#444c6a' }} />
                            <div>
                              <div className="text-xs font-medium" style={{ color: isRecurring ? '#00cce8' : '#8490b0' }}>
                                Transação recorrente
                              </div>
                              {isRecurring && (
                                <div className="text-xs mt-0.5" style={{ color: '#444c6a' }}>
                                  Repetir automaticamente
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Toggle pill */}
                          <div
                            className="flex-shrink-0 rounded-full transition-all duration-200"
                            style={{ width: 36, height: 20, background: isRecurring ? '#00cce8' : '#1c1f32', position: 'relative' }}
                          >
                            <div
                              className="absolute top-0.5 rounded-full transition-all duration-200"
                              style={{ width: 16, height: 16, background: '#fff', left: isRecurring ? 18 : 2 }}
                            />
                          </div>
                        </div>

                        {isRecurring && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <Lbl>Frequência</Lbl>
                            <div className="flex gap-2">
                              {([
                                { v: 'weekly',  label: 'Semanal'  },
                                { v: 'monthly', label: 'Mensal'   },
                                { v: 'yearly',  label: 'Anual'    },
                              ] as { v: RecurrenceFrequency; label: string }[]).map(f => (
                                <button key={f.v} type="button"
                                  onClick={() => setFrequency(f.v)}
                                  className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                                  style={{
                                    background: frequency === f.v ? 'rgba(0,204,232,0.1)' : 'transparent',
                                    border:     `1px solid ${frequency === f.v ? 'rgba(0,204,232,0.3)' : '#1c1f32'}`,
                                    color:      frequency === f.v ? '#00cce8' : '#8490b0',
                                  }}
                                >{f.label}</button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}

                    {/* ═══════════════════════════════════════════
                        ACTIONS
                    ═══════════════════════════════════════════ */}
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button" onClick={handleClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        style={{ background: '#1c1f32', color: '#8490b0' }}
                      >
                        Cancelar
                      </button>
                      <motion.button
                        whileHover={{ scale: isValid ? 1.02 : 1 }}
                        whileTap={{ scale: isValid ? 0.97 : 1 }}
                        type="submit"
                        disabled={loading || !isValid}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: isValid
                            ? `linear-gradient(135deg, ${typeMeta.color}, ${typeMeta.color}cc)`
                            : '#1c1f32',
                          color:  isValid ? '#06060a' : '#444c6a',
                          cursor: isValid ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {loading ? 'Salvando...' : isEdit
                          ? 'Salvar Alterações'
                          : `Registrar ${typeMeta.label}`}
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
