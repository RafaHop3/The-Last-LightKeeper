import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { Camera, Save, User, Mail, Phone, Building2, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

export default function CandidateProfile() {
  const { user, login } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    company: user?.company || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null)
  const fileInput = useRef(null)

  const updateLocalUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    window.location.reload()
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.put('/auth/profile', form)
      updateLocalUser(res.data)
      setSuccess('Perfil atualizado com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateLocalUser(res.data)
      setSuccess('Foto atualizada!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro no upload')
      setAvatarPreview(user?.avatar_url || null)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Avatar Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Foto de Perfil</h2>
        <div className="flex items-center gap-6">
          <div className="relative group">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-100" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10 text-primary-400" />
              </div>
            )}
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30 transition-all group-hover:scale-110"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Alterar foto</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG ou WebP. Máximo 5MB.</p>
            {uploading && <p className="text-xs text-primary-600 mt-1 font-medium">Enviando...</p>}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Informações Pessoais</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nome completo</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:bg-white outline-none transition-all"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Seu nome"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Email não pode ser alterado</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:bg-white outline-none transition-all"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Empresa atual</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:bg-white outline-none transition-all"
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
                placeholder="Onde você trabalha"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Sobre mim</label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:bg-white outline-none transition-all resize-y min-h-[100px]"
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Conte um pouco sobre você, sua experiência e objetivos profissionais..."
            />
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Informações da Conta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Tipo de Conta</p>
            <p className="text-sm font-semibold text-gray-700 capitalize">{user?.role}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Membro desde</p>
            <p className="text-sm font-semibold text-gray-700">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '-'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Status</p>
            <p className="text-sm font-semibold text-emerald-600">Ativo</p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary py-3 px-8 flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  )
}
