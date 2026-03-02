import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api'
import { Search, MapPin, Briefcase, Building2, DollarSign, Clock, Filter } from 'lucide-react'

function formatSalary(min, max) {
  const fmt = (v) => `R$ ${(v).toLocaleString('pt-BR')}`
  if (min && max) return `${fmt(min)} - ${fmt(max)}`
  if (min) return `A partir de ${fmt(min)}`
  if (max) return `Até ${fmt(max)}`
  return null
}

function JobTypeBadge({ type }) {
  const map = {
    remote: { label: 'Remoto', class: 'badge-remote' },
    hybrid: { label: 'Híbrido', class: 'badge-hybrid' },
    onsite: { label: 'Presencial', class: 'badge-onsite' },
  }
  const info = map[type] || { label: type, class: 'badge' }
  return <span className={info.class}>{info.label}</span>
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'ontem'
  if (days < 30) return `${days} dias atrás`
  return `${Math.floor(days / 30)} meses atrás`
}

export default function Jobs() {
  const loc = useLocation()
  const basePath = loc.pathname.startsWith('/candidate') ? '/candidate/jobs' : '/jobs'
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('')

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (location) params.location = location
      if (jobType) params.job_type = jobType
      const res = await api.get('/jobs', { params })
      setJobs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vagas Disponíveis</h1>
        <p className="text-gray-500 mb-6">Encontre a oportunidade perfeita para você</p>
        
        <form onSubmit={handleSearch} className="card p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Cargo, empresa ou palavra-chave..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Localização..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="input-field pl-10 pr-8 appearance-none min-w-[160px]"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
              >
                <option value="">Todos os tipos</option>
                <option value="remote">Remoto</option>
                <option value="hybrid">Híbrido</option>
                <option value="onsite">Presencial</option>
              </select>
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2 justify-center">
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">Nenhuma vaga encontrada</h3>
          <p className="text-gray-400">Tente ajustar seus filtros de busca</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{jobs.length} vaga{jobs.length !== 1 ? 's' : ''} encontrada{jobs.length !== 1 ? 's' : ''}</p>
          {jobs.map((job) => (
            <Link key={job.id} to={`${basePath}/${job.id}`} className="card p-6 block group hover:-translate-y-0.5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{job.title}</h3>
                    <JobTypeBadge type={job.job_type} />
                  </div>
                  <p className="text-primary-600 font-medium mb-2">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                    {formatSalary(job.salary_min, job.salary_max) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                    )}
                    {job.created_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo(job.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-3 line-clamp-2">{job.description}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-sm text-gray-400">{job.application_count} candidatura{job.application_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
