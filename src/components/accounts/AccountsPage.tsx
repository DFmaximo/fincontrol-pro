import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Wallet } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatMonthYear, addMonths } from '@/lib/utils'
import { AccountCard, NewAccountCard } from './AccountCard'
import SummaryCards from './SummaryCards'
import RecentTransactions from './RecentTransactions'
import MonthlyChart from './MonthlyChart'
import MonthlyInsights from './MonthlyInsights'
import DepositModal from './DepositModal'
import TransferModal from './TransferModal'
import NewAccountModal from './NewAccountModal'
import type { Account } from '@/types/database'

export default function AccountsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 0, 1))
  const [depositTarget, setDepositTarget] = useState<Account | null>(null)
  const [transferTarget, setTransferTarget] = useState<Account | null>(null)
  const [showNewAccount, setShowNewAccount] = useState(false)

  const { accounts, loading: accLoading, totalBalance, totalAvailable, deposit, transfer, createAccount } = useAccounts()
  const { transactions, loading: txLoading, totalIncome, totalExpense } = useTransactions({
    month: currentMonth,
    limit: 10,
    status: 'completed',
  })

  const prevMonth = () => setCurrentMonth(d => addMonths(d, -1))
  const nextMonth = () => setCurrentMonth(d => addMonths(d, 1))
  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()

  const totalReceivable = totalIncome - totalExpense > 0 ? totalIncome - totalExpense : 0

  return (
    <div className="space-y-7">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#e6e8f0', letterSpacing: '-0.025em' }}>
            Contas &amp; Carteiras
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#8490b0' }}>
            Gerencie todas as suas contas e movimentações financeiras
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* Month selector */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: '#0c0d18', border: '1px solid #1c1f32' }}
          >
            <button onClick={prevMonth} className="p-1 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#8490b0' }}>
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-medium px-1 min-w-[130px] text-center capitalize" style={{ color: '#e6e8f0' }}>
              {formatMonthYear(currentMonth)}
            </span>
            <button onClick={nextMonth} disabled={isCurrentMonth} className="p-1 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-30" style={{ color: '#8490b0' }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Quick balance summary */}
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-xs" style={{ color: '#444c6a' }}>Saldo Disponível</div>
              <div className="text-base font-bold tabular-nums" style={{ color: '#00d87f', letterSpacing: '-0.02em' }}>
                {formatCurrency(totalAvailable)}
              </div>
            </div>
            <div style={{ width: 1, background: '#1c1f32' }} />
            <div className="text-right">
              <div className="text-xs" style={{ color: '#444c6a' }}>Resultado do Mês</div>
              <div className="text-base font-bold tabular-nums" style={{ color: totalReceivable > 0 ? '#00cce8' : '#8490b0', letterSpacing: '-0.02em' }}>
                {formatCurrency(totalReceivable)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Summary cards ── */}
      <SummaryCards
        totalBalance={totalBalance}
        totalAvailable={totalAvailable}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      {/* ── Section heading + add button ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: '#e6e8f0' }}>Minhas Contas</h2>
          <p className="text-xs mt-0.5" style={{ color: '#444c6a' }}>
            {accounts.length} {accounts.length === 1 ? 'conta ativa' : 'contas ativas'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowNewAccount(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: 'rgba(0,216,127,0.1)',
            border: '1px solid rgba(0,216,127,0.22)',
            color: '#00d87f',
          }}
        >
          <Plus size={14} />
          Nova Conta
        </motion.button>
      </div>

      {/* ── Accounts grid ── */}
      {accLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl animate-pulse" style={{ minHeight: 230, background: '#0c0d18', border: '1px solid #1c1f32' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {accounts.map((account, i) => (
            <AccountCard
              key={account.id}
              account={account}
              index={i}
              onDeposit={setDepositTarget}
              onTransfer={setTransferTarget}
            />
          ))}
          <NewAccountCard index={accounts.length} onClick={() => setShowNewAccount(true)} />
        </div>
      )}

      {/* ── Bottom section: Transactions + Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] 2xl:grid-cols-[1fr_420px] gap-5">
        {/* Recent transactions (wider) */}
        <div className="min-h-[400px]">
          <RecentTransactions transactions={transactions} loading={txLoading} />
        </div>

        {/* Right panel: chart + insights */}
        <div className="space-y-4">
          <MonthlyChart />
          <MonthlyInsights />
        </div>
      </div>

      {/* ── Modals ── */}
      <DepositModal
        account={depositTarget}
        open={Boolean(depositTarget)}
        onClose={() => setDepositTarget(null)}
        onConfirm={deposit}
      />
      <TransferModal
        fromAccount={transferTarget}
        accounts={accounts}
        open={Boolean(transferTarget)}
        onClose={() => setTransferTarget(null)}
        onConfirm={transfer}
      />
      <NewAccountModal
        open={showNewAccount}
        onClose={() => setShowNewAccount(false)}
        onConfirm={createAccount}
      />
    </div>
  )
}
