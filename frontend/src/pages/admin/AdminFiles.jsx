import { useState, useEffect, useRef } from 'react'
import api from '../../api'
import { FolderOpen, Upload, Trash2, FileText, Image, File, Download, Copy, CheckCircle2, RefreshCw } from 'lucide-react'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ type }) {
  if (type?.startsWith('image/')) return <Image className="w-5 h-5 text-pink-400" />
  if (type?.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />
  return <File className="w-5 h-5 text-blue-400" />
}

export default function AdminFiles() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [copied, setCopied] = useState(null)
  const fileInput = useRef(null)

  const fetchFiles = async () => {
    setLoading(true)
    try { const res = await api.get('/admin/files'); setFiles(res.data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleScan = async () => {
    setScanning(true)
    try { await api.post('/admin/files/scan'); fetchFiles() }
    catch (err) { console.error(err) }
    finally { setScanning(false) }
  }

  useEffect(() => { handleScan() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post('/admin/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      fetchFiles()
    } catch (err) { alert(err.response?.data?.detail || 'Erro no upload') }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = '' }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este arquivo?')) return
    try { await api.delete(`/admin/files/${id}`); fetchFiles() }
    catch (err) { alert(err.response?.data?.detail || 'Erro') }
  }

  const copyUrl = (path) => {
    const url = `${window.location.origin}${path}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(path)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciador de Arquivos</h1>
          <p className="text-gray-500 text-sm mt-1">{files.length} arquivo{files.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleScan} disabled={scanning} className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 px-4 rounded-xl transition-all text-sm flex items-center gap-2 disabled:opacity-50 border border-gray-700">
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} /> Sincronizar
          </button>
          <input ref={fileInput} type="file" className="hidden" onChange={handleUpload} />
          <button onClick={() => fileInput.current?.click()} disabled={uploading} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-2 disabled:opacity-50">
            <Upload className="w-4 h-4" /> {uploading ? 'Enviando...' : 'Upload'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div></div>
        ) : files.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-14 h-14 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum arquivo</p>
            <p className="text-gray-600 text-xs mt-1">Faça upload do primeiro arquivo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Arquivo</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tamanho</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <FileIcon type={f.content_type} />
                        <div>
                          <p className="font-medium text-gray-200 text-xs">{f.original_name}</p>
                          <p className="text-[10px] text-gray-600 font-mono">{f.filename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{f.content_type || '-'}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{formatSize(f.size)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{f.created_at ? new Date(f.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => copyUrl(f.path)} className="p-1.5 text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all" title="Copiar URL">
                          {copied === f.path ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a href={f.path} target="_blank" rel="noreferrer" className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Download">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => handleDelete(f.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
