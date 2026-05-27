export type AccountType = 'cash' | 'bank' | 'credit' | 'investment' | 'digital'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type TransactionStatus = 'pending' | 'completed' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: Account
        Insert: Omit<Account, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Account, 'id' | 'created_at'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      goals: {
        Row: Goal
        Insert: Omit<Goal, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Goal, 'id' | 'created_at'>>
      }
      recurring_transactions: {
        Row: RecurringTransaction
        Insert: Omit<RecurringTransaction, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<RecurringTransaction, 'id' | 'created_at'>>
      }
    }
  }
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  available_balance: number
  color: string
  icon: string
  bank_name?: string
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id?: string
  description: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  occurred_on: string
  created_at: string
  updated_at: string
  notes?: string
  tags?: string[]
  destination_account_id?: string
  accounts?: Account
  categories?: Category
}

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: 'income' | 'expense' | 'both'
  parent_id?: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date?: string
  icon: string
  color: string
  category?: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface RecurringTransaction {
  id: string
  user_id: string
  account_id: string
  category_id?: string
  description: string
  amount: number
  type: TransactionType
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  next_occurrence: string
  last_occurrence?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
