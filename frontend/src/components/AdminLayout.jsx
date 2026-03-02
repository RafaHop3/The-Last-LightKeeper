import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Database, FolderOpen, Settings, Palette,
  CreditCard, LogOut, Menu, X, Briefcase, ChevronRight, Shield
} from 'lucide-react'

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/users', icon: Users, label: 'Usuários' },
  { path: '/admin/plans', icon: CreditCard, label: 'Planos' },
  { path: '/admin/settings', icon: Palette, label: 'Tema & Conteúdo' },
  { path: '/admin/files', icon: FolderOpen, label: 'Arquivos' },
  { path: '/admin/database', icon: Database, label: 'Banco de Dados' },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname.startsWith(item.path)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-gray-800">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">Apliquei</span>
            <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold -mt-0.5">Backoffice</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {item.label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-500" />}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <Link to="/" className="flex items-center gap-2 px-3 py-2 mt-1 text-xs text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800/60 transition-all">
            <Briefcase className="w-3.5 h-3.5" />
            Voltar ao site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="h-14 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 flex items-center px-4 lg:hidden sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 text-sm font-semibold text-gray-200">Backoffice</span>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
