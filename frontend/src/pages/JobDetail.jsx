import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { MapPin, Building2, DollarSign, Clock, Briefcase, ArrowLeft, Send, CheckCircle2, AlertCircle, User } from 'lucide-react'

function formatSalary(min, max) {
  const fmt = (v) => `R$ ${(v).toLocaleString('pt-BR')}`
  if (min && max) return `${fmt(min)} - ${fmt(max)}`
  if (min) return `A partir de ${fmt(min)}`
  if (max) return `Até ${fmt(max)}`
  return null
}

const typeLabel = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' }
const typeBadge = { remote: 'badge-remote', hybrid: 'badge-hybrid', onsite: 'badge-onsite' }

export default function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const isInPanel = loc.pathname.startsWith('/candidate')
  const backTo = isInPanel ? '/candidate/jobs' : '/jobs'
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState('')
  const [showApplyForm, setShowApplyForm] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`)
        setJob(res.data)
      } catch {
        navigate(backTo)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id])

  const handleApply = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setError('')
    setApplying(true)
    try {
      await api.post('/applications', { job_id: parseInt(id), cover_letter: coverLetter })
      setApplied(true)
      setShowApplyForm(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao se candidatar')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-primary-600 font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar às vagas
      </Link>

      <div className="card p-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{job.title}</h1>
            <p className="text-lg text-primary-600 font-semibold">{job.company}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <span className={typeBadge[job.job_type] || 'badge'}>{typeLabel[job.job_type] || job.job_type}</span>
          <span className="badge bg-gray-50 text-gray-600 border border-gray-200">
            <MapPin className="w-3 h-3 mr-1" />
            {job.location}
          </span>
          {formatSalary(job.salary_min, job.salary_max) && (
            <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
              <DollarSign className="w-3 h-3 mr-1" />
              {formatSalary(job.salary_min, job.salary_max)}
            </span>
          )}
          {job.recruiter_name && (
            <span className="badge bg-primary-50 text-primary-700 border border-primary-200">
              <User className="w-3 h-3 mr-1" />
              {job.recruiter_name}
            </span>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Descrição da Vaga</h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</div>
          </div>

          {job.requirements && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Requisitos</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">{job.requirements}</div>
            </div>
          )}

          {job.benefits && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Benefícios</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">{job.benefits}</div>
            </div>
          )}
        </div>

        {/* Apply Section */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          {applied ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">Candidatura enviada com sucesso! Boa sorte!</span>
            </div>
          ) : user?.role === 'recruiter' ? (
            <p className="text-gray-400 text-sm">Recrutadores não podem se candidatar a vagas.</p>
          ) : !showApplyForm ? (
            <button
              onClick={() => user ? setShowApplyForm(true) : navigate('/login')}
              className="btn-primary flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Candidatar-se
            </button>
          ) : (
            <form onSubmit={handleApply} className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Candidatar-se a esta vaga</h3>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Carta de Apresentação (opcional)</label>
                <textarea
                  className="input-field min-h-[120px] resize-y"
                  placeholder="Conte um pouco sobre você e por que se interessa por esta vaga..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={applying} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  <Send className="w-4 h-4" />
                  {applying ? 'Enviando...' : 'Enviar Candidatura'}
                </button>
                <button type="button" onClick={() => setShowApplyForm(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
