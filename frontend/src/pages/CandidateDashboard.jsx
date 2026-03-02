import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import {
  Briefcase, Clock, CheckCircle2, XCircle, Eye, Building2,
  ExternalLink, Search, User, FileText, ArrowRight
} from 'lucide-react'

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, dot: 'bg-amber-400' },
  reviewed: { label: 'Em Análise', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Eye, dot: 'bg-blue-400' },
  accepted: { label: 'Aceito', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, dot: 'bg-emerald-400' },
  rejected: { label: 'Rejeitado', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, dot: 'bg-red-400' },
}

export default function CandidateDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/applications/my').then(res => setApplications(res.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  const recent = applications.slice(0, 5)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Acompanhe suas candidaturas e gerencie seu perfil</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Total', value: stats.total, icon: Briefcase, bg: 'bg-primary-50', iconColor: 'text-primary-600' },
          { label: 'Pendentes', value: stats.pending, icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { label: 'Em Análise', value: stats.reviewed, icon: Eye, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
          { label: 'Aceitas', value: stats.accepted, icon: CheckCircle2, bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { label: 'Rejeitadas', value: stats.rejected, icon: XCircle, bg: 'bg-red-50', iconColor: 'text-red-500' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2.5`}>
                <Icon className={`w-4.5 h-4.5 ${s.iconColor}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Candidaturas Recentes</h2>
            {applications.length > 5 && (
              <Link to="/candidate/applications" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : recent.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-500 mb-1">Nenhuma candidatura ainda</h3>
              <p className="text-sm text-gray-400 mb-5">Comece buscando vagas que combinam com você</p>
              <Link to="/candidate/jobs" className="btn-primary inline-flex items-center gap-2 text-sm">
                <Search className="w-4 h-4" /> Buscar Vagas
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recent.map((app) => {
                const st = statusConfig[app.status] || statusConfig.pending
                const StatusIcon = st.icon
                return (
                  <div key={app.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{app.job_title}</h3>
                        </div>
                        <p className="text-xs text-gray-400">{app.job_company} • {app.created_at ? new Date(app.created_at).toLocaleDateString('pt-BR') : ''}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${st.color} flex-shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                        {st.label}
                      </span>
                      <Link to={`/candidate/jobs/${app.job_id}`} className="p-2 text-gray-300 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="space-y-2.5">
            <Link to="/candidate/jobs" className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-emerald-200 transition-all group">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">Buscar Vagas</p>
                <p className="text-[11px] text-gray-400">Encontre novas oportunidades</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
            </Link>

            <Link to="/candidate/applications" className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-primary-200 transition-all group">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">Todas Candidaturas</p>
                <p className="text-[11px] text-gray-400">Ver histórico completo</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </Link>

            <Link to="/candidate/profile" className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all group">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">Editar Perfil</p>
                <p className="text-[11px] text-gray-400">Foto, bio e contato</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
