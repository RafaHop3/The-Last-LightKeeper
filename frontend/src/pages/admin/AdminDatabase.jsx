import { useState, useEffect } from 'react'
import api from '../../api'
import { Database, Table, ChevronRight, ArrowLeft, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react'

export default function AdminDatabase() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableData, setTableData] = useState(null)
  const [loadingData, setLoadingData] = useState(false)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  useEffect(() => {
    api.get('/admin/db/tables').then(res => setTables(res.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const viewTable = async (name, pageNum = 0) => {
    setSelectedTable(name)
    setPage(pageNum)
    setLoadingData(true)
    try {
      const res = await api.get(`/admin/db/tables/${name}`, { params: { limit: PAGE_SIZE, offset: pageNum * PAGE_SIZE } })
      setTableData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoadingData(false) }
  }

  const totalPages = tableData ? Math.ceil(tableData.total / PAGE_SIZE) : 0

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div></div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Banco de Dados</h1>
        <p className="text-gray-500 text-sm mt-1">Visualize e explore as tabelas do sistema</p>
      </div>

      {!selectedTable ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(t => (
            <button key={t.name} onClick={() => viewTable(t.name)} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-left hover:border-primary-500/50 hover:bg-gray-900/80 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                  <Table className="w-5 h-5 text-primary-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 transition-colors" />
              </div>
              <p className="font-semibold text-gray-200 text-sm">{t.name}</p>
              <p className="text-xs text-gray-500 mt-1">{t.row_count} registro{t.row_count !== 1 ? 's' : ''} • {t.columns.length} coluna{t.columns.length !== 1 ? 's' : ''}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {t.columns.slice(0, 5).map(c => (
                  <span key={c} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md border border-gray-700">{c}</span>
                ))}
                {t.columns.length > 5 && <span className="text-[10px] text-gray-500">+{t.columns.length - 5}</span>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button onClick={() => { setSelectedTable(null); setTableData(null) }} className="flex items-center gap-1.5 text-gray-400 hover:text-primary-400 text-sm font-medium mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar às tabelas
          </button>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-200">{selectedTable}</h2>
                <p className="text-xs text-gray-500">{tableData?.total || 0} registros</p>
              </div>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div></div>
            ) : tableData && tableData.rows.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {tableData.columns.map(col => (
                          <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-2.5 text-gray-300 whitespace-nowrap max-w-[200px] truncate" title={String(cell ?? '')}>
                              {cell === null ? <span className="text-gray-600 italic">NULL</span> : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Página {page + 1} de {totalPages}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => viewTable(selectedTable, 0)} disabled={page === 0} className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 rounded-lg hover:bg-gray-800 transition-all"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                      <button onClick={() => viewTable(selectedTable, page - 1)} disabled={page === 0} className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 rounded-lg hover:bg-gray-800 transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
                      <button onClick={() => viewTable(selectedTable, page + 1)} disabled={page >= totalPages - 1} className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 rounded-lg hover:bg-gray-800 transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
                      <button onClick={() => viewTable(selectedTable, totalPages - 1)} disabled={page >= totalPages - 1} className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 rounded-lg hover:bg-gray-800 transition-all"><ChevronsRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Tabela vazia</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
