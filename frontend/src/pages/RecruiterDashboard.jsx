import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { Plus, Briefcase, Users, Eye, Edit3, Trash2, ToggleLeft, ToggleRight, Building2, MapPin } from 'lucide-react'

const typeLabel = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' }

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs/recruiter/my-jobs')
      setJobs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])

  const toggleActive = async (job) => {
    try {
      await api.put(`/jobs/${job.id}`, { is_active: job.is_active ? 0 : 1 })
      fetchJobs()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteJob = async (jobId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta vaga?')) return
    try {
      await api.delete(`/jobs/${jobId}`)
      fetchJobs()
    } catch (err) {
      console.error(err)
    }
  }

  const totalApplications = jobs.reduce((sum, j) => sum + (j.application_count || 0), 0)
  const activeJobs = jobs.filter(j => j.is_active).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Olá, {user?.name}! Gerencie suas vagas aqui.</p>
        </div>
        <Link to="/recruiter/create" className="btn-primary flex items-center gap-2 justify-center">
          <Plus className="w-4 h-4" />
          Nova Vaga
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              <p className="text-sm text-gray-500">Total de Vagas</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeJobs}</p>
              <p className="text-sm text-gray-500">Vagas Ativas</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
              <p className="text-sm text-gray-500">Total de Candidaturas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">Nenhuma vaga criada</h3>
          <p className="text-gray-400 mb-6">Comece criando sua primeira vaga de emprego</p>
          <Link to="/recruiter/create" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Criar Primeira Vaga
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className={`card p-6 ${!job.is_active ? 'opacity-60' : ''}`}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                    {!job.is_active && (
                      <span className="badge bg-gray-100 text-gray-500 border border-gray-200">Inativa</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                    <span className="badge bg-primary-50 text-primary-700 border border-primary-200">
                      {typeLabel[job.job_type] || job.job_type}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-accent-600">
                      <Users className="w-3.5 h-3.5" />
                      {job.application_count} candidatura{job.application_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/recruiter/jobs/${job.id}/applications`}
                    className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
                    title="Ver candidaturas"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Candidaturas</span>
                  </Link>
                  <Link
                    to={`/recruiter/edit/${job.id}`}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => toggleActive(job)}
                    className={`p-2 rounded-lg transition-all ${
                      job.is_active
                        ? 'text-emerald-500 hover:bg-emerald-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={job.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {job.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
