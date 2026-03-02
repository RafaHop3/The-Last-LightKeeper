import { Link } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, Search, FileText, UserPlus,
  GraduationCap, Zap, TrendingUp, Shield, BarChart3, Briefcase
} from 'lucide-react'

export default function ForCandidates() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" /> 100% Gratuito para Candidatos
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
            Encontre seu{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              emprego dos sonhos
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Busque vagas, candidate-se com um clique e acompanhe todo o processo. Sem custos, sem limites.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5 flex items-center gap-2 text-lg">
              Criar Conta Grátis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/jobs" className="btn-secondary text-lg py-3.5 px-8 flex items-center gap-2">
              <Search className="w-5 h-5" /> Ver Vagas
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-14 text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium">Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium">+10.000 vagas</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium">Empresas verificadas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Como funciona</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Encontre seu emprego ideal em 3 passos simples</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: UserPlus, step: '1', title: 'Crie seu Perfil', desc: 'Cadastre-se gratuitamente em segundos e tenha acesso a milhares de vagas de todo o Brasil.' },
              { icon: Search, step: '2', title: 'Busque Vagas', desc: 'Filtre por área, localização e tipo de trabalho. Use busca inteligente para encontrar a vaga ideal.' },
              { icon: FileText, step: '3', title: 'Candidate-se', desc: 'Aplique com um clique, envie sua carta de apresentação e acompanhe o status em tempo real.' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="card p-8 text-center group hover:-translate-y-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 font-bold text-sm rounded-full flex items-center justify-center mx-auto mb-3">{item.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Tudo que você precisa</h2>
            <p className="text-lg text-gray-500">Sem pagar nada</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Search, title: 'Busca Avançada', desc: 'Filtros por localização, tipo e salário' },
              { icon: FileText, title: 'Candidatura Rápida', desc: 'Aplique com carta de apresentação' },
              { icon: BarChart3, title: 'Dashboard', desc: 'Acompanhe todas suas candidaturas' },
              { icon: CheckCircle2, title: 'Status em Tempo Real', desc: 'Saiba quando for aceito ou revisado' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="bg-white rounded-2xl p-6 border border-emerald-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
                  <Icon className="w-6 h-6 text-emerald-600 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
            Comece a buscar vagas agora
          </h2>
          <p className="text-lg text-emerald-100 mb-8">
            Cadastre-se em segundos e encontre a oportunidade perfeita para sua carreira.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="bg-white text-emerald-700 font-semibold py-3.5 px-8 rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:-translate-y-0.5 flex items-center gap-2 text-lg">
              Criar Conta Grátis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/jobs" className="border-2 border-white/30 text-white font-semibold py-3.5 px-8 rounded-xl hover:bg-white/10 transition-all hover:-translate-y-0.5 text-lg backdrop-blur-sm">
              Ver Vagas Disponíveis
            </Link>
          </div>
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
