import { useState, useEffect } from 'react'
import api from '../../api'
import { Users, Search, Plus, Edit3, Trash2, X, Shield, Briefcase, GraduationCap, CheckCircle2, XCircle } from 'lucide-react'

const roleMap = {
  admin: { label: 'Admin', icon: Shield, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  recruiter: { label: 'Recrutador', icon: Briefcase, color: 'text-accent-400 bg-accent-500/10 border-accent-500/20' },
  candidate: { label: 'Candidato', icon: GraduationCap, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
}

const planLabels = { free: 'Grátis', basic: 'Básico', pro: 'Profissional', enterprise: 'Enterprise' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate', company: '', phone: '', plan: 'free' })
  const [saving, setSaving] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const res = await api.get('/admin/users', { params })
      setUsers(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [roleFilter])

  const handleSearch = (e) => { e.preventDefault(); fetchUsers() }

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', role: 'candidate', company: '', phone: '', plan: 'free' })
    setModal('create')
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, role: u.role, company: u.company || '', phone: u.phone || '', is_active: u.is_active, plan: u.plan || 'free' })
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/admin/users', form)
      } else {
        const { password, ...data } = form
        await api.put(`/admin/users/${editUser.id}`, data)
      }
      setModal(null)
      fetchUsers()
    } catch (err) { alert(err.response?.data?.detail || 'Erro') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza?')) return
    try { await api.delete(`/admin/users/${id}`); fetchUsers() }
    catch (err) { alert(err.response?.data?.detail || 'Erro') }
  }

  const toggleActive = async (u) => {
    try { await api.put(`/admin/users/${u.id}`, { is_active: u.is_active ? 0 : 1 }); fetchUsers() }
    catch (err) { alert(err.response?.data?.detail || 'Erro') }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 outline-none" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:border-primary-500 outline-none" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">Todos os roles</option>
            <option value="admin">Admin</option>
            <option value="recruiter">Recrutador</option>
            <option value="candidate">Candidato</option>
          </select>
          <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 px-4 rounded-xl transition-all text-sm">Buscar</button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plano</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const r = roleMap[u.role] || roleMap.candidate
                  const RIcon = r.icon
                  return (
                    <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center text-primary-400 text-xs font-bold">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-200">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${r.color}`}>
                          <RIcon className="w-3 h-3" /> {r.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{planLabels[u.plan] || u.plan}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => toggleActive(u)} className={`inline-flex items-center gap-1 text-xs font-medium ${u.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                          {u.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {u.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(u)} className="p-1.5 text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'Novo Usuário' : 'Editar Usuário'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500 outline-none" placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500 outline-none" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              {modal === 'create' && (
                <input type="password" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500 outline-none" placeholder="Senha" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              )}
              <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:border-primary-500 outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="candidate">Candidato</option>
                <option value="recruiter">Recrutador</option>
                <option value="admin">Admin</option>
              </select>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500 outline-none" placeholder="Empresa (opcional)" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
              <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:border-primary-500 outline-none" value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}>
                <option value="free">Grátis</option>
                <option value="basic">Básico</option>
                <option value="pro">Profissional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl transition-all text-sm disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 rounded-xl transition-all text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
