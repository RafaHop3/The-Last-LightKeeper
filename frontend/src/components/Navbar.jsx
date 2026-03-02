import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Briefcase, LogOut, Menu, X, User, LayoutDashboard, Search, CreditCard, Shield } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/25 group-hover:shadow-primary-600/40 transition-all duration-300">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-accent-600 bg-clip-text text-transparent">
              Apliquei
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/jobs" className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-primary-50 transition-all duration-200">
              <Search className="w-4 h-4" /> Vagas
            </Link>
                        {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-1.5 text-gray-600 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200">
                    <Shield className="w-4 h-4" /> Backoffice
                  </Link>
                )}
                {user.role === 'recruiter' && (
                  <>
                    <Link to="/pricing" className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-primary-50 transition-all duration-200">
                      <CreditCard className="w-4 h-4" /> Planos
                    </Link>
                    <Link to="/recruiter" className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-primary-50 transition-all duration-200">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200" title="Sair">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Entrar</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Cadastrar</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          <Link to="/jobs" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
            Vagas
          </Link>
                    {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-red-50 font-medium text-red-600">
                  Backoffice
                </Link>
              )}
              {user.role === 'recruiter' && (
                <>
                  <Link to="/pricing" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
                    Planos
                  </Link>
                  <Link to="/recruiter" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
                    Dashboard
                  </Link>
                </>
              )}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 px-3 py-2">
                  <User className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 font-medium flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-center btn-secondary w-full">Entrar</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block text-center btn-primary w-full">Cadastrar</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
