import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Wallet, ArrowLeftRight, CreditCard,
  FileText, Tag, Target, TrendingUp, PieChart,
  Brain, Bot, BarChart3, Users, Settings,
  ChevronRight, Sparkles, Bell, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  badge?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Contas e Carteiras', path: '/contas', icon: <Wallet size={18} /> },
  { label: 'Transações', path: '/transacoes', icon: <ArrowLeftRight size={18} /> },
  { label: 'Cartões', path: '/cartoes', icon: <CreditCard size={18} /> },
  { label: 'Obrigações & Contas', path: '/obrigacoes', icon: <FileText size={18} /> },
  { label: 'Categorias', path: '/categorias', icon: <Tag size={18} /> },
  { label: 'Metas', path: '/metas', icon: <Target size={18} /> },
  { label: 'Investimentos', path: '/investimentos', icon: <TrendingUp size={18} /> },
  { label: 'Orçamentos', path: '/orcamentos', icon: <PieChart size={18} /> },
  { label: 'Análise IA', path: '/analise-ia', icon: <Brain size={18} />, badge: 'IA' },
  { label: 'Assistente IA', path: '/assistente-ia', icon: <Bot size={18} />, badge: 'IA' },
  { label: 'Relatórios', path: '/relatorios', icon: <BarChart3 size={18} /> },
  { label: 'Família', path: '/familia', icon: <Users size={18} /> },
  { label: 'Configurações', path: '/configuracoes', icon: <Settings size={18} /> },
]

const navGroups = [
  { title: 'Principal', items: navItems.slice(0, 5) },
  { title: 'Gestão', items: navItems.slice(5, 9) },
  { title: 'Inteligência', items: navItems.slice(9, 11) },
  { title: 'Mais', items: navItems.slice(11) },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col"
      style={{
        width: 'var(--sidebar-w, 280px)',
        background: '#08090f',
        borderRight: '1px solid #1c1f32',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid #1c1f3244' }}>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #00d87f22, #00cce822)',
            border: '1px solid #00d87f33',
          }}
        >
          <Sparkles size={18} style={{ color: '#00d87f' }} />
        </div>
        <div>
          <div className="font-semibold text-sm tracking-tight" style={{ color: '#e6e8f0' }}>
            FinControl
          </div>
          <div className="text-xs font-medium" style={{ color: '#00d87f' }}>
            Pro
          </div>
        </div>
        <div className="ml-auto">
          <Bell size={16} style={{ color: '#444c6a' }} className="cursor-pointer hover:text-text transition-colors" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div
              className="px-3 mb-1.5 text-xs font-semibold tracking-widest uppercase"
              style={{ color: '#2a3050' }}
            >
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <NavLink key={item.path} to={item.path}>
                    {({ isActive: linkActive }) => (
                      <motion.div
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group',
                          linkActive || isActive
                            ? 'nav-active-bar'
                            : ''
                        )}
                        style={{
                          background: linkActive || isActive
                            ? 'linear-gradient(90deg, rgba(0,216,127,0.08), rgba(0,204,232,0.04))'
                            : 'transparent',
                          color: linkActive || isActive ? '#00d87f' : '#8490b0',
                        }}
                      >
                        <span
                          className="transition-colors duration-150"
                          style={{ color: linkActive || isActive ? '#00d87f' : '#444c6a' }}
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              background: 'linear-gradient(135deg, #00d87f22, #00cce822)',
                              color: '#00d87f',
                              border: '1px solid #00d87f33',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                        {(linkActive || isActive) && (
                          <ChevronRight size={12} style={{ color: '#00d87f44' }} />
                        )}
                      </motion.div>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="px-4 py-4"
        style={{ borderTop: '1px solid #1c1f3244' }}
      >
        <motion.div
          whileHover={{ backgroundColor: 'rgba(28,31,50,0.6)' }}
          className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors"
        >
          <div
            className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
            style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #00d87f, #00cce8)',
              color: '#06060a',
            }}
          >
            DM
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: '#e6e8f0' }}>Diego Máximo</div>
            <div className="text-xs truncate" style={{ color: '#444c6a' }}>diegomaximo160@gmail.com</div>
          </div>
          <LogOut size={14} style={{ color: '#444c6a' }} className="flex-shrink-0 hover:text-red transition-colors" />
        </motion.div>
      </div>
    </aside>
  )
}
