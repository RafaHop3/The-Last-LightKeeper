import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import {
  ArrowRight, CheckCircle2, Briefcase, Building2, Eye, BarChart3,
  Star, CreditCard, Users, Zap, Crown, Rocket, TrendingUp, Shield
} from 'lucide-react'

const tierIcons = { free: Briefcase, basic: Zap, pro: Crown, enterprise: Rocket }
const tierGradients = {
  free: 'from-gray-100 to-gray-50',
  basic: 'from-blue-100 to-blue-50',
  pro: 'from-primary-100 to-accent-50',
  enterprise: 'from-amber-100 to-orange-50',
}
const tierBorders = {
  free: 'border-gray-200 hover:border-gray-300',
  basic: 'border-blue-200 hover:border-blue-300',
  pro: 'border-primary-300 hover:border-primary-400 ring-2 ring-primary-100',
  enterprise: 'border-amber-200 hover:border-amber-300',
}

export default function ForRecruiters() {
  const [plans, setPlans] = useState([])

  useEffect(() => {
    api.get('/plans').then(res => setPlans(res.data)).catch(console.error)
  }, [])

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent-200/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-full mb-6">
            <Star className="w-3 h-3" /> Para Recrutadores e Empresas
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
            Recrute os{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              melhores talentos
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Publique vagas, gerencie candidaturas e encontre profissionais qualificados para sua empresa.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-accent text-lg py-3.5 px-8 flex items-center gap-2 hover:-translate-y-0.5">
              Começar a Recrutar <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#planos" className="btn-secondary text-lg py-3.5 px-8 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Ver Planos
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-14 text-gray-400">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <span className="text-sm font-medium">Milhares de candidatos</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-500" />
              <span className="text-sm font-medium">Dashboard completo</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              <span className="text-sm font-medium">Gestão de candidaturas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Como funciona</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Gerencie todo o processo seletivo em uma única plataforma</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Briefcase, step: '1', title: 'Publique Vagas', desc: 'Crie vagas detalhadas com requisitos, benefícios e faixa salarial. Destaque suas oportunidades.' },
              { icon: Eye, step: '2', title: 'Receba Candidatos', desc: 'Visualize candidaturas, cartas de apresentação e perfis dos candidatos interessados.' },
              { icon: BarChart3, step: '3', title: 'Gerencie Tudo', desc: 'Aceite, rejeite e acompanhe candidatos com um dashboard completo e intuitivo.' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="card p-8 text-center group hover:-translate-y-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="w-8 h-8 bg-primary-100 text-primary-700 font-bold text-sm rounded-full flex items-center justify-center mx-auto mb-3">{item.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="py-24 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Planos & Preços</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Escolha o plano que melhor se adapta ao tamanho da sua empresa</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const Icon = tierIcons[plan.tier] || Briefcase
              const gradient = tierGradients[plan.tier] || 'from-gray-100 to-gray-50'
              const borderClass = tierBorders[plan.tier] || 'border-gray-200'
              const isPro = plan.tier === 'pro'

              return (
                <div key={plan.id} className={`relative card border-2 p-6 flex flex-col ${borderClass} ${isPro ? 'scale-[1.02]' : ''}`}>
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary-600 to-accent-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <span className="text-xs text-gray-400 uppercase mb-3">{plan.tier}</span>

                  <div className="mb-4">
                    <span className="text-3xl font-black text-gray-900">
                      {plan.price === 0 ? 'Grátis' : `R$ ${(plan.price / 100).toFixed(0)}`}
                    </span>
                    {plan.price > 0 && <span className="text-gray-400 text-sm">/mês</span>}
                  </div>

                  {plan.description && <p className="text-sm text-gray-500 mb-5">{plan.description}</p>}

                  <div className="space-y-2.5 flex-1 mb-6">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Até <strong>{plan.max_jobs >= 9999 ? 'ilimitadas' : plan.max_jobs}</strong> vaga{plan.max_jobs !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Ver até <strong>{plan.max_applications_view >= 9999 ? 'ilimitadas' : plan.max_applications_view}</strong> candidaturas</span>
                    </div>
                    {plan.featured_jobs > 0 && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span><strong>{plan.featured_jobs >= 50 ? 'Ilimitadas' : plan.featured_jobs}</strong> vaga{plan.featured_jobs !== 1 ? 's' : ''} destaque</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Suporte {plan.tier === 'pro' || plan.tier === 'enterprise' ? 'prioritário' : 'por email'}</span>
                    </div>
                  </div>

                  <Link to="/register" className={`text-center block w-full py-3 px-4 rounded-xl font-semibold transition-all text-sm ${isPro ? 'btn-accent' : 'btn-secondary'}`}>
                    {plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
            Comece a recrutar hoje
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Publique sua primeira vaga em minutos e conecte-se com os melhores profissionais.
          </p>
          <Link to="/register" className="bg-white text-primary-700 font-semibold py-3.5 px-8 rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2 text-lg">
            Criar Conta de Recrutador <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-3 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-white">Apliquei</span>
          </Link>
          <p className="text-xs">&copy; 2025 Apliquei. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
