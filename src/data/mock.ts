import type { Account, Category } from '@/types/database'
import type { Transaction } from '@/modules/transactions/types'
import type { Card, Invoice } from '@/types/cards'

export const mockCategories: Category[] = [
  { id: 'c1', user_id: 'u1', name: 'Salário', icon: 'briefcase', color: '#00d87f', type: 'income', created_at: '2024-01-01' },
  { id: 'c2', user_id: 'u1', name: 'Freelance', icon: 'laptop', color: '#00cce8', type: 'income', created_at: '2024-01-01' },
  { id: 'c3', user_id: 'u1', name: 'Alimentação', icon: 'utensils', color: '#ff9443', type: 'expense', created_at: '2024-01-01' },
  { id: 'c4', user_id: 'u1', name: 'Moradia', icon: 'home', color: '#8b5cf6', type: 'expense', created_at: '2024-01-01' },
  { id: 'c5', user_id: 'u1', name: 'Transporte', icon: 'car', color: '#ffd60a', type: 'expense', created_at: '2024-01-01' },
  { id: 'c6', user_id: 'u1', name: 'Saúde', icon: 'heart', color: '#ff3860', type: 'expense', created_at: '2024-01-01' },
  { id: 'c7', user_id: 'u1', name: 'Lazer', icon: 'music', color: '#00cce8', type: 'expense', created_at: '2024-01-01' },
  { id: 'c8', user_id: 'u1', name: 'Educação', icon: 'book', color: '#00d87f', type: 'expense', created_at: '2024-01-01' },
]

export const mockAccounts: Account[] = [
  {
    id: 'a1',
    user_id: 'u1',
    name: 'Carteira',
    type: 'cash',
    balance: 2500.00,
    available_balance: 2500.00,
    color: '#00d87f',
    icon: 'wallet',
    currency: 'BRL',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'a2',
    user_id: 'u1',
    name: 'Nubank',
    type: 'digital',
    balance: 15750.50,
    available_balance: 14250.50,
    color: '#8b5cf6',
    icon: 'credit-card',
    bank_name: 'Nubank',
    currency: 'BRL',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'a3',
    user_id: 'u1',
    name: 'Bradesco',
    type: 'bank',
    balance: 8200.00,
    available_balance: 8200.00,
    color: '#ff3860',
    icon: 'building-2',
    bank_name: 'Bradesco',
    currency: 'BRL',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
]

// Helper to build a full Transaction mock with defaults
function tx(base: Partial<Transaction> & Pick<Transaction, 'id'|'account_id'|'description'|'amount'|'type'|'occurred_on'>): Transaction {
  return {
    user_id: 'u1',
    category_id: null,
    destination_account_id: null,
    status: 'completed',
    source: 'manual',
    effective_date: base.occurred_on,
    is_recurring: false,
    recurring_transaction_id: null,
    transfer_pair_id: null,
    notes: null,
    tags: null,
    created_at: `${base.occurred_on}T10:00:00`,
    updated_at: `${base.occurred_on}T10:00:00`,
    ...base,
  } as Transaction
}

export const mockTransactions: Transaction[] = [
  tx({ id:'t1', account_id:'a2', category_id:'c1', description:'Salário Janeiro',   amount:  8500.00, type:'income',  occurred_on:'2024-01-05', source:'accounts', accounts: mockAccounts[1], categories: mockCategories[0] }),
  tx({ id:'t2', account_id:'a2', category_id:'c4', description:'Aluguel',           amount: -2200.00, type:'expense', occurred_on:'2024-01-10', accounts: mockAccounts[1], categories: mockCategories[3] }),
  tx({ id:'t3', account_id:'a1', category_id:'c3', description:'Supermercado',      amount:  -380.50, type:'expense', occurred_on:'2024-01-12', accounts: mockAccounts[0], categories: mockCategories[2] }),
  tx({ id:'t4', account_id:'a2', category_id:'c2', description:'Projeto Freelance', amount:  2800.00, type:'income',  occurred_on:'2024-01-15', accounts: mockAccounts[1], categories: mockCategories[1] }),
  tx({ id:'t5', account_id:'a3', category_id:'c5', description:'Combustível',       amount:  -280.00, type:'expense', occurred_on:'2024-01-18', accounts: mockAccounts[2], categories: mockCategories[4] }),
  tx({ id:'t6',  account_id:'a2', category_id:'c6', description:'Plano de Saúde',   amount: -450.00, type:'expense', occurred_on:'2024-01-20', source:'obligations', accounts: mockAccounts[1], categories: mockCategories[5] }),
  tx({ id:'t7',  account_id:'a1', category_id:'c7', description:'Cinema e Jantar',  amount: -195.00, type:'expense', occurred_on:'2024-01-22', accounts: mockAccounts[0], categories: mockCategories[6] }),
  tx({ id:'t8',  account_id:'a3', category_id:'c8', description:'Curso Online',     amount: -320.00, type:'expense', occurred_on:'2024-01-25', accounts: mockAccounts[2], categories: mockCategories[7] }),
  tx({ id:'t9',  account_id:'a2', category_id:'c1', description:'Bônus Performance',amount: 1500.00, type:'income',  occurred_on:'2024-01-28', source:'accounts', accounts: mockAccounts[1], categories: mockCategories[0] }),
  tx({ id:'t10', account_id:'a1', category_id:'c3', description:'Restaurante',      amount: -145.00, type:'expense', occurred_on:'2024-01-30',
    accounts: mockAccounts[0],
    categories: mockCategories[2],
  }),
]

export const mockCards: Card[] = [
  {
    id: 'card1',
    user_id: 'u1',
    name: 'Nubank Platinum',
    bank_name: 'Nubank',
    last_four: '4521',
    brand: 'mastercard',
    credit_limit: 12000,
    available_limit: 8450,
    closing_day: 15,
    due_day: 22,
    color: '#8b5cf6',
    icon: 'credit-card',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'card2',
    user_id: 'u1',
    name: 'Inter Gold',
    bank_name: 'Inter',
    last_four: '7832',
    brand: 'mastercard',
    credit_limit: 6000,
    available_limit: 5200,
    closing_day: 5,
    due_day: 12,
    color: '#ff9443',
    icon: 'credit-card',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
]

export const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    card_id: 'card1',
    year: 2024,
    month: 1,
    status: 'open',
    total_amount: 3550.00,
    paid_amount: 0,
    closing_date: '2024-01-15',
    due_date: '2024-01-22',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'inv2',
    card_id: 'card2',
    year: 2024,
    month: 1,
    status: 'open',
    total_amount: 800.00,
    paid_amount: 0,
    closing_date: '2024-01-05',
    due_date: '2024-01-12',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
]

export const mockMonthlyData = [
  { month: 'Ago', income: 9200, expense: 4100 },
  { month: 'Set', income: 10500, expense: 4800 },
  { month: 'Out', income: 8800, expense: 5200 },
  { month: 'Nov', income: 11200, expense: 3900 },
  { month: 'Dez', income: 13500, expense: 6200 },
  { month: 'Jan', income: 12800, expense: 3970 },
]
