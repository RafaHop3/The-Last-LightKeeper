import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Mail, Lock, User, Building2, AlertCircle, Briefcase, GraduationCap } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: '', company: '', bio: '', phone: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.role) { setError('Selecione um tipo de conta'); return }
    setError('')
    setLoading(true)
    try {
      const user = await register(form)
      navigate(user.role === 'recruiter' ? '/recruiter' : '/candidate')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="w-full max-w-lg">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/25">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Criar Conta</h1>
            <p className="text-gray-500 mt-1">Junte-se ao Apliquei gratuitamente</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'candidate' })}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                form.role === 'candidate'
                  ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <GraduationCap className={`w-6 h-6 mx-auto mb-2 ${form.role === 'candidate' ? 'text-primary-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${form.role === 'candidate' ? 'text-primary-700' : 'text-gray-600'}`}>Candidato</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'recruiter' })}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                form.role === 'recruiter'
                  ? 'border-accent-500 bg-accent-50 shadow-lg shadow-accent-500/10'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <Briefcase className={`w-6 h-6 mx-auto mb-2 ${form.role === 'recruiter' ? 'text-accent-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${form.role === 'recruiter' ? 'text-accent-700' : 'text-gray-600'}`}>Recrutador</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" className="input-field pl-10" placeholder="Seu nome" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" className="input-field pl-10" placeholder="seu@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" className="input-field pl-10" placeholder="Crie uma senha forte" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
            </div>
            {form.role === 'recruiter' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" className="input-field pl-10" placeholder="Nome da empresa" value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-center disabled:opacity-50">
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
