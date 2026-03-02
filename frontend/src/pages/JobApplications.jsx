import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import { ArrowLeft, Users, Mail, FileText, CheckCircle2, XCircle, Eye, Clock } from 'lucide-react'

const statusMap = {
  pending: { label: 'Pendente', class: 'badge-pending', icon: Clock },
  reviewed: { label: 'Analisado', class: 'badge-reviewed', icon: Eye },
  accepted: { label: 'Aceito', class: 'badge-accepted', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', class: 'badge-rejected', icon: XCircle },
}

export default function JobApplications() {
  const { id } = useParams()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [jobTitle, setJobTitle] = useState('')

  const fetchApplications = async () => {
    try {
      const res = await api.get(`/applications/job/${id}`)
      setApplications(res.data)
      if (res.data.length > 0) {
        setJobTitle(res.data[0].job_title)
      } else {
        const jobRes = await api.get(`/jobs/${id}`)
        setJobTitle(jobRes.data.title)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApplications() }, [id])

  const updateStatus = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status })
      fetchApplications()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/recruiter" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-primary-600 font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-primary-100 rounded-2xl flex items-center justify-center">
          <Users className="w-6 h-6 text-accent-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidaturas</h1>
          <p className="text-gray-500">{jobTitle} &mdash; {applications.length} candidatura{applications.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">Nenhuma candidatura</h3>
          <p className="text-gray-400">Ainda não há candidatos para esta vaga</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const st = statusMap[app.status] || statusMap.pending
            const StatusIcon = st.icon
            return (
              <div key={app.id} className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{app.candidate_name}</h3>
                      <span className={st.class}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <Mail className="w-3.5 h-3.5" />
                      <a href={`mailto:${app.candidate_email}`} className="hover:text-primary-600 transition-colors">
                        {app.candidate_email}
                      </a>
                    </div>
                    {app.cover_letter && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                          <FileText className="w-3.5 h-3.5" />
                          Carta de Apresentação
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{app.cover_letter}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {app.status !== 'reviewed' && (
                      <button onClick={() => updateStatus(app.id, 'reviewed')} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        Analisar
                      </button>
                    )}
                    {app.status !== 'accepted' && (
                      <button onClick={() => updateStatus(app.id, 'accepted')} className="btn-success text-xs py-1.5 px-3 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aceitar
                      </button>
                    )}
                    {app.status !== 'rejected' && (
                      <button onClick={() => updateStatus(app.id, 'rejected')} className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeitar
                      </button>
                    )}
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
