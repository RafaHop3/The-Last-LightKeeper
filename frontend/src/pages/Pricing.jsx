import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2, Sparkles, ArrowRight, Briefcase, Zap, Crown, Rocket } from 'lucide-react'

const tierIcons = { free: Briefcase, basic: Zap, pro: Crown, enterprise: Rocket }
const tierColors = {
  free: 'border-gray-200',
  basic: 'border-blue-200 bg-blue-50/30',
  pro: 'border-primary-300 bg-primary-50/30 ring-2 ring-primary-200',
  enterprise: 'border-amber-200 bg-amber-50/30',
}
const tierBtnColors = {
  free: 'btn-secondary',
  basic: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/25',
  pro: 'btn-accent',
  enterprise: 'bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/25',
}

export default function Pricing() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/plans').then(res => setPlans(res.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-2 mb-6">
          <Sparkles className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-semibold text-primary-700">Planos para Recrutadores</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
          Encontre o plano ideal
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Candidatos usam a plataforma gratuitamente. Recrutadores escolhem o plano que melhor se adapta às suas necessidades.
        </p>
      </div>

      {/* Free for candidates banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 mb-10 text-center">
        <h3 className="text-lg font-bold text-emerald-800 mb-1">Candidatos? 100% Grátis!</h3>
        <p className="text-emerald-600 text-sm">Busque vagas, candidate-se e acompanhe tudo sem pagar nada.</p>
        {!user && (
          <Link to="/register" className="inline-flex items-center gap-2 mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-5 rounded-xl transition-all text-sm">
            Criar Conta Grátis <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = tierIcons[plan.tier] || Briefcase
          const cardClass = tierColors[plan.tier] || 'border-gray-200'
          const btnClass = tierBtnColors[plan.tier] || 'btn-secondary'
          const isPro = plan.tier === 'pro'

          return (
            <div key={plan.id} className={`relative card border-2 p-6 flex flex-col ${cardClass} ${isPro ? 'scale-[1.02]' : ''}`}>
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-600 to-accent-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPro ? 'bg-primary-100' : 'bg-gray-100'}`}>
                  <Icon className={`w-5 h-5 ${isPro ? 'text-primary-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  <span className="text-xs text-gray-400 uppercase">{plan.tier}</span>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-4xl font-black text-gray-900">
                  {plan.price === 0 ? 'Grátis' : `R$ ${(plan.price / 100).toFixed(0)}`}
                </span>
                {plan.price > 0 && <span className="text-gray-400 text-sm">/mês</span>}
              </div>

              {plan.description && <p className="text-sm text-gray-500 mb-5">{plan.description}</p>}

              <div className="space-y-3 flex-1 mb-6">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Até <strong>{plan.max_jobs >= 9999 ? 'ilimitadas' : plan.max_jobs}</strong> vaga{plan.max_jobs !== 1 ? 's' : ''} ativa{plan.max_jobs !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Ver até <strong>{plan.max_applications_view >= 9999 ? 'ilimitadas' : plan.max_applications_view}</strong> candidaturas</span>
                </div>
                {plan.featured_jobs > 0 && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong>{plan.featured_jobs >= 50 ? 'Ilimitadas' : plan.featured_jobs}</strong> vaga{plan.featured_jobs !== 1 ? 's' : ''} em destaque</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Suporte por email</span>
                </div>
                {(plan.tier === 'pro' || plan.tier === 'enterprise') && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Suporte prioritário</span>
                  </div>
                )}
              </div>

              <Link
                to={user ? '#' : '/register'}
                className={`${btnClass} text-center block w-full`}
              >
                {plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
