import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { Users, Briefcase, FileText, FolderOpen, TrendingUp, UserPlus, Eye, ArrowRight, Database, Palette, CreditCard } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div></div>
  }

  const cards = [
    { label: 'Total Usuários', value: stats?.total_users || 0, icon: Users, bg: 'bg-primary-500/10', iconColor: 'text-primary-400' },
    { label: 'Candidatos', value: stats?.total_candidates || 0, icon: UserPlus, bg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
    { label: 'Recrutadores', value: stats?.total_recruiters || 0, icon: Briefcase, bg: 'bg-accent-500/10', iconColor: 'text-accent-400' },
    { label: 'Vagas Totais', value: stats?.total_jobs || 0, icon: Eye, bg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
    { label: 'Vagas Ativas', value: stats?.active_jobs || 0, icon: TrendingUp, bg: 'bg-teal-500/10', iconColor: 'text-teal-400' },
    { label: 'Candidaturas', value: stats?.total_applications || 0, icon: FileText, bg: 'bg-amber-500/10', iconColor: 'text-amber-400' },
    { label: 'Arquivos', value: stats?.total_files || 0, icon: FolderOpen, bg: 'bg-rose-500/10', iconColor: 'text-rose-400' },
    { label: 'Novos Hoje', value: stats?.users_today || 0, icon: UserPlus, bg: 'bg-indigo-500/10', iconColor: 'text-indigo-400' },
  ]

  const quickLinks = [
    { label: 'Gerenciar Usuários', to: '/admin/users', icon: Users, desc: 'Criar, editar e gerenciar contas' },
    { label: 'Planos & Preços', to: '/admin/plans', icon: CreditCard, desc: 'Editar planos de recrutadores' },
    { label: 'Tema & Configurações', to: '/admin/settings', icon: Palette, desc: 'Personalizar aparência do site' },
    { label: 'Arquivos', to: '/admin/files', icon: FolderOpen, desc: 'Upload e gerenciamento de arquivos' },
    { label: 'Banco de Dados', to: '/admin/database', icon: Database, desc: 'Explorar tabelas do sistema' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da plataforma Apliquei</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{card.value.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-gray-300 mb-4">Acesso Rápido</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickLinks.map((link, i) => {
          const Icon = link.icon
          return (
            <Link key={i} to={link.to} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-primary-500/40 hover:bg-gray-900/80 transition-all duration-300 group flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-200 text-sm">{link.label}</p>
                <p className="text-xs text-gray-500 truncate">{link.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 transition-colors flex-shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
