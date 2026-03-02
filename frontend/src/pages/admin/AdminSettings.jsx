import { useState, useEffect } from 'react'
import api from '../../api'
import { Palette, Save, Plus, Trash2, X, Type, Image, Globe } from 'lucide-react'

const categoryIcons = { theme: Palette, content: Type, general: Globe }
const categoryLabels = { theme: 'Tema & Aparência', content: 'Conteúdo', general: 'Geral' }

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [newSetting, setNewSetting] = useState({ key: '', value: '', category: 'general' })

  const fetchSettings = async () => {
    setLoading(true)
    try { const res = await api.get('/admin/settings'); setSettings(res.data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSettings() }, [])

  const handleUpdate = async (setting) => {
    setSaving(s => ({ ...s, [setting.id]: true }))
    try {
      await api.put(`/admin/settings/${setting.id}`, { value: setting.value })
    } catch (err) { alert(err.response?.data?.detail || 'Erro') }
    finally { setSaving(s => ({ ...s, [setting.id]: false })) }
  }

  const handleAdd = async () => {
    if (!newSetting.key || !newSetting.value) return
    try {
      await api.post('/admin/settings', newSetting)
      setNewSetting({ key: '', value: '', category: 'general' })
      setShowAdd(false)
      fetchSettings()
    } catch (err) { alert(err.response?.data?.detail || 'Erro') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta configuração?')) return
    try { await api.delete(`/admin/settings/${id}`); fetchSettings() }
    catch (err) { alert(err.response?.data?.detail || 'Erro') }
  }

  const updateLocal = (id, value) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, value } : s))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div></div>
  }

  const grouped = {}
  settings.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = []
    grouped[s.category].push(s)
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tema & Configurações</h1>
          <p className="text-gray-500 text-sm mt-1">Personalize a aparência e conteúdo do site</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Configuração
        </button>
      </div>

      {/* Add new */}
      {showAdd && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200">Nova Configuração</h3>
            <button onClick={() => setShowAdd(false)} className="p-1 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500 outline-none" placeholder="Chave (ex: site_name)" value={newSetting.key} onChange={e => setNewSetting({...newSetting, key: e.target.value})} />
            <input className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500 outline-none sm:col-span-2" placeholder="Valor" value={newSetting.value} onChange={e => setNewSetting({...newSetting, value: e.target.value})} />
            <select className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:border-primary-500 outline-none" value={newSetting.category} onChange={e => setNewSetting({...newSetting, category: e.target.value})}>
              <option value="general">Geral</option>
              <option value="theme">Tema</option>
              <option value="content">Conteúdo</option>
            </select>
          </div>
          <button onClick={handleAdd} className="mt-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-xl transition-all text-sm">Adicionar</button>
        </div>
      )}

      {/* Settings by category */}
      {Object.entries(grouped).map(([category, items]) => {
        const CatIcon = categoryIcons[category] || Globe
        return (
          <div key={category} className="bg-gray-900 border border-gray-800 rounded-2xl mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center">
                <CatIcon className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-200 text-sm">{categoryLabels[category] || category}</h2>
                <p className="text-xs text-gray-500">{items.length} configurações</p>
              </div>
            </div>

            <div className="divide-y divide-gray-800/50">
              {items.map(s => (
                <div key={s.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="sm:w-48 flex-shrink-0">
                    <p className="text-xs font-mono text-gray-400 bg-gray-800 inline-block px-2 py-0.5 rounded">{s.key}</p>
                  </div>
                  <div className="flex-1">
                    {s.key.includes('color') ? (
                      <div className="flex items-center gap-3">
                        <input type="color" value={s.value || '#000000'} onChange={e => updateLocal(s.id, e.target.value)} className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent" />
                        <input className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 font-mono focus:border-primary-500 outline-none" value={s.value || ''} onChange={e => updateLocal(s.id, e.target.value)} />
                      </div>
                    ) : s.key.includes('description') || s.key.includes('text') || s.key.includes('subtitle') ? (
                      <textarea className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:border-primary-500 outline-none min-h-[80px] resize-y" value={s.value || ''} onChange={e => updateLocal(s.id, e.target.value)} />
                    ) : (
                      <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:border-primary-500 outline-none" value={s.value || ''} onChange={e => updateLocal(s.id, e.target.value)} />
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleUpdate(s)} disabled={saving[s.id]} className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all disabled:opacity-50" title="Salvar">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
