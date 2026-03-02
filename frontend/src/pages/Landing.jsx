import { Link } from 'react-router-dom'
import { Briefcase, Sparkles, ArrowRight, Building2, GraduationCap, Zap, Star } from 'lucide-react'

function FooterLogo() {
  return (
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
  )
}

export default function Landing() {
  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Conectando talentos e empresas</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-5">
              Bem-vindo ao{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Apliquei
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed">
              Selecione como você quer usar a plataforma
            </p>
          </div>

          {/* Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Candidato */}
            <Link to="/para-candidatos" className="group relative block">
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-lg"></div>
              <div className="relative bg-white border-2 border-gray-100 group-hover:border-emerald-300 rounded-3xl p-8 sm:p-10 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-emerald-500/10 group-hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Sou Candidato</h2>

                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-4">
                  <Zap className="w-3 h-3" /> 100% Grátis
                </span>

                <p className="text-gray-500 leading-relaxed mb-6">
                  Busque vagas, candidate-se com um clique e acompanhe todo o processo sem pagar nada.
                </p>

                <div className="flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all duration-300">
                  Acessar <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>

            {/* Recrutador */}
            <Link to="/para-recrutadores" className="group relative block">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary-400 to-accent-500 rounded-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-lg"></div>
              <div className="relative bg-white border-2 border-gray-100 group-hover:border-primary-300 rounded-3xl p-8 sm:p-10 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary-500/10 group-hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/25 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Sou Recrutador</h2>

                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-4">
                  <Star className="w-3 h-3" /> Planos a partir de R$ 0
                </span>

                <p className="text-gray-500 leading-relaxed mb-6">
                  Publique vagas, gerencie candidaturas e encontre os melhores talentos para sua empresa.
                </p>

                <div className="flex items-center gap-2 text-primary-600 font-semibold group-hover:gap-3 transition-all duration-300">
                  Acessar <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <FooterLogo />
    </div>
  )
}
