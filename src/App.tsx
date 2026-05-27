import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import AccountsPage from '@/components/accounts/AccountsPage'
import DashboardPage from '@/pages/Dashboard'
import TransactionsPage from '@/pages/Transactions'
import CardsPage from '@/pages/Cards'
import ObligationsPage from '@/pages/Obligations'
import CategoriesPage from '@/pages/Categories'
import GoalsPage from '@/pages/Goals'
import InvestmentsPage from '@/pages/Investments'
import BudgetsPage from '@/pages/Budgets'
import AIAnalysisPage from '@/pages/AIAnalysis'
import AIAssistantPage from '@/pages/AIAssistant'
import ReportsPage from '@/pages/Reports'
import FamilyPage from '@/pages/Family'
import SettingsPage from '@/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contas" element={<AccountsPage />} />
          <Route path="/transacoes" element={<TransactionsPage />} />
          <Route path="/cartoes" element={<CardsPage />} />
          <Route path="/obrigacoes" element={<ObligationsPage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/metas" element={<GoalsPage />} />
          <Route path="/investimentos" element={<InvestmentsPage />} />
          <Route path="/orcamentos" element={<BudgetsPage />} />
          <Route path="/analise-ia" element={<AIAnalysisPage />} />
          <Route path="/assistente-ia" element={<AIAssistantPage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/familia" element={<FamilyPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
