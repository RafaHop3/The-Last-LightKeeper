import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../api'
import { ArrowLeft, Edit3, AlertCircle } from 'lucide-react'

export default function EditJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({
    title: '', company: '', location: '', job_type: 'remote',
    salary_min: '', salary_max: '', description: '', requirements: '', benefits: '',
  })

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`)
        const j = res.data
        setForm({
          title: j.title, company: j.company, location: j.location, job_type: j.job_type,
          salary_min: j.salary_min || '', salary_max: j.salary_max || '',
          description: j.description, requirements: j.requirements || '', benefits: j.benefits || '',
        })
      } catch {
        navigate('/recruiter')
      } finally {
        setFetching(false)
      }
    }
    fetchJob()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      }
      await api.put(`/jobs/${id}`, payload)
      navigate('/recruiter')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao atualizar vaga')
    } finally {
      setLoading(false)
    }
  }

  const update = (field, value) => setForm({ ...form, [field]: value })

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/recruiter" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-primary-600 font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Dashboard
      </Link>

      <div className="card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center">
            <Edit3 className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Vaga</h1>
            <p className="text-gray-500 text-sm">Atualize os detalhes da vaga</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Título da Vaga *</label>
              <input type="text" className="input-field" value={form.title}
                onChange={(e) => update('title', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa *</label>
              <input type="text" className="input-field" value={form.company}
                onChange={(e) => update('company', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Localização *</label>
              <input type="text" className="input-field" value={form.location}
                onChange={(e) => update('location', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Trabalho *</label>
              <select className="input-field" value={form.job_type} onChange={(e) => update('job_type', e.target.value)}>
                <option value="remote">Remoto</option>
                <option value="hybrid">Híbrido</option>
                <option value="onsite">Presencial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Salário Mínimo (R$)</label>
              <input type="number" className="input-field" value={form.salary_min}
                onChange={(e) => update('salary_min', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Salário Máximo (R$)</label>
              <input type="number" className="input-field" value={form.salary_max}
                onChange={(e) => update('salary_max', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição da Vaga *</label>
            <textarea className="input-field min-h-[120px] resize-y"
              value={form.description} onChange={(e) => update('description', e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Requisitos</label>
            <textarea className="input-field min-h-[100px] resize-y"
              value={form.requirements} onChange={(e) => update('requirements', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Benefícios</label>
            <textarea className="input-field min-h-[100px] resize-y"
              value={form.benefits} onChange={(e) => update('benefits', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <Link to="/recruiter" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
