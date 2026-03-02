import { useState, useEffect } from 'react'
import api from '../../api'
import { CreditCard, Save, CheckCircle2, X } from 'lucide-react'

const tierColors = {
  free: 'from-gray-500 to-gray-600',
  basic: 'from-blue-500 to-blue-600',
  pro: 'from-primary-500 to-accent-500',
  enterprise: 'from-amber-500 to-orange-500',
}

export default function AdminPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})

  const fetchPlans = async () => {
    setLoading(true)
    try { const res = await api.get('/admin/plans'); setPlans(res.data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPlans() }, [])

  const startEdit = (plan) => {
    setEditId(plan.id)
    setForm({ name: plan.name, price: plan.price, max_jobs: plan.max_jobs, max_applications_view: plan.max_applications_view, featured_jobs: plan.featured_jobs, description: plan.description || '' })
  }

  const handleSave = async (id) => {
    setSaving(s => ({ ...s, [id]: true }))
    try {
      await api.put(`/admin/plans/${id}`, form)
      setEditId(null)
      fetchPlans()
    } catch (err) { alert(err.response?.data?.detail || 'Erro') }
    finally { setSaving(s => ({ ...s, [id]: false })) }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div></div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Planos & Preços</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie os planos de assinatura para recrutadores</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {plans.map(plan => {
          const editing = editId === plan.id
          const gradient = tierColors[plan.tier] || tierColors.free
          return (
            <div key={plan.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all">
              <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
              <div className="p-5">
                {editing ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">{plan.tier}</span>
                      <button onClick={() => setEditId(null)} className="p-1 text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
                    </div>
                    <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-200 focus:border-primary-500 outline-none" placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-semibold">Preço (centavos)</label>
                        <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-200 focus:border-primary-500 outline-none mt-1" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-semibold">Max Vagas</label>
                        <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-200 focus:border-primary-500 outline-none mt-1" value={form.max_jobs} onChange={e => setForm({...form, max_jobs: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-semibold">Max Visualizações</label>
                        <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-200 focus:border-primary-500 outline-none mt-1" value={form.max_applications_view} onChange={e => setForm({...form, max_applications_view: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-semibold">Vagas Destaque</label>
                        <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-200 focus:border-primary-500 outline-none mt-1" value={form.featured_jobs} onChange={e => setForm({...form, featured_jobs: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                    <textarea className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-200 focus:border-primary-500 outline-none resize-y min-h-[60px]" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <button onClick={() => handleSave(plan.id)} disabled={saving[plan.id]} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                      <Save className="w-4 h-4" /> {saving[plan.id] ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">{plan.tier}</span>
                      <button onClick={() => startEdit(plan)} className="text-xs text-gray-500 hover:text-primary-400 transition-colors">Editar</button>
                    </div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <div className="mt-2 mb-4">
                      <span className="text-3xl font-black text-white">R$ {(plan.price / 100).toFixed(2).replace('.', ',')}</span>
                      <span className="text-gray-500 text-sm">/mês</span>
                    </div>
                    {plan.description && <p className="text-gray-400 text-sm mb-4">{plan.description}</p>}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        Até {plan.max_jobs >= 9999 ? '∞' : plan.max_jobs} vaga{plan.max_jobs !== 1 ? 's' : ''} ativa{plan.max_jobs !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        Ver até {plan.max_applications_view >= 9999 ? '∞' : plan.max_applications_view} candidaturas
                      </div>
                      {plan.featured_jobs > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          {plan.featured_jobs >= 50 ? '∞' : plan.featured_jobs} vaga{plan.featured_jobs !== 1 ? 's' : ''} em destaque
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
