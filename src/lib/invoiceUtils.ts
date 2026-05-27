import type { Card } from '@/types/cards'

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export interface InvoiceInfo {
  year: number
  month: number       // 1–12
  monthName: string
  closingDate: string // ISO date
  dueDate: string     // ISO date
  label: string       // "Fevereiro 2024"
}

/**
 * Determines which invoice a purchase falls into based on the card's closing_day.
 *
 * Rule:
 *   purchase day <= closing_day  →  current month's invoice
 *   purchase day >  closing_day  →  next month's invoice
 */
export function getInvoiceForDate(card: Card, purchaseDateStr: string): InvoiceInfo {
  const d   = new Date(purchaseDateStr + 'T12:00:00')
  const day = d.getDate()
  const m0  = d.getMonth()    // 0-based
  const y   = d.getFullYear()

  // Determine invoice month (1-based)
  let invM = day <= card.closing_day ? m0 + 1 : m0 + 2
  let invY = y
  if (invM > 12) { invM -= 12; invY++ }

  const closingDate = toISODate(invY, invM, card.closing_day)

  // Due date: if due_day < closing_day it falls in the NEXT month after closing
  let dueM = invM, dueY = invY
  if (card.due_day < card.closing_day) {
    dueM++
    if (dueM > 12) { dueM = 1; dueY++ }
  }
  const dueDate = toISODate(dueY, dueM, card.due_day)

  return {
    year:      invY,
    month:     invM,
    monthName: MONTH_NAMES[invM - 1],
    closingDate,
    dueDate,
    label:     `${MONTH_NAMES[invM - 1]} ${invY}`,
  }
}

/** Format ISO date as DD/MM/YYYY */
export function formatBrazilianDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

/** Format month/year label */
export function formatInvoiceMonth(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

// ── Private helpers ───────────────────────────────────────────

function toISODate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
