// ── Card types ────────────────────────────────────────────────

export type CardBrand     = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard'
export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'overdue'

export interface Card {
  id: string
  user_id: string
  name: string            // "Nubank Platinum"
  bank_name: string       // "Nubank"
  last_four: string       // "4521"
  brand: CardBrand
  credit_limit: number
  available_limit: number
  closing_day: number     // day of month (1–31) — fatura fecha neste dia
  due_day: number         // day of month (1–31) — vencimento da fatura
  color: string
  icon: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  card_id: string
  year: number
  month: number          // 1–12
  status: InvoiceStatus
  total_amount: number
  paid_amount: number
  closing_date: string   // ISO date — quando a fatura fecha
  due_date: string       // ISO date — vencimento para pagamento
  created_at: string
  updated_at: string
}

export interface InstallmentPlan {
  id: string
  user_id: string
  card_id: string
  description: string
  total_amount: number
  installment_amount: number
  total_installments: number
  paid_installments: number
  purchase_date: string
  first_installment_date: string
  created_at: string
}
