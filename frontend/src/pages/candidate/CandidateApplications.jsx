import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import {
  Briefcase, Clock, CheckCircle2, XCircle, Eye, Building2,
  ExternalLink, Search, Filter
} from 'lucide-react'

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  reviewed: { label: 'Em Análise', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
  accepted: { label: 'Aceito', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejeitado', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' },
}

const filters = [
  { value: '', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'reviewed', label: 'Em Análise' },
  { value: 'accepted', label: 'Aceitas' },
  { value: 'rejected', label: 'Rejeitadas' },
]

export default function CandidateApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/applications/my').then(res => setApplications(res.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = applications.filter(a => {
    if (filter && a.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (a.job_title || '').toLowerCase().includes(q) || (a.job_company || '').toLowerCase().includes(q)
    }
    return true
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Candidaturas</h1>
        <p className="text-gray-500 text-sm mt-1">{applications.length} candidatura{applications.length !== 1 ? 's' : ''} no total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            placeholder="Buscar por vaga ou empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                filter === f.value
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-500 mb-1">
            {applications.length === 0 ? 'Nenhuma candidatura' : 'Nenhum resultado'}
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            {applications.length === 0 ? 'Você ainda não se candidatou a nenhuma vaga' : 'Tente ajustar os filtros'}
          </p>
          {applications.length === 0 && (
            <Link to="/jobs" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Search className="w-4 h-4" /> Buscar Vagas
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const st = statusConfig[app.status] || statusConfig.pending
            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-0.5">{app.job_title}</h3>
                    <p className="text-sm text-gray-400">{app.job_company}</p>
                    {app.cover_letter && (
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-1 italic">"{app.cover_letter}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                        {st.label}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    <span className={`sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                      {st.label}
                    </span>
                    <Link to={`/candidate/jobs/${app.job_id}`} className="p-2.5 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all" title="Ver vaga">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
