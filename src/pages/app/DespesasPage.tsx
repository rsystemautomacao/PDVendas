import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Receipt, Check, Trash2, Edit, AlertTriangle } from 'lucide-react'
import { useFinanceiro } from '../../contexts/FinanceiroContext'
import { formatCurrency, formatDate } from '../../utils/helpers'

export function DespesasPage() {
  const navigate = useNavigate()
  const { despesas, pagarDespesa, removeDespesa } = useFinanceiro()

  const hoje = new Date().toISOString().substring(0, 10)
  const mesInicio = hoje.substring(0, 7) + '-01'
  const mesFim = hoje.substring(0, 7) + '-31'

  const [dataDe, setDataDe] = useState(mesInicio)
  const [dataAte, setDataAte] = useState(mesFim)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'pendentes' | 'pagas'>('todas')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return despesas
      .filter(d => {
        if (dataDe && d.vencimento < dataDe) return false
        if (dataAte && d.vencimento > dataAte) return false
        if (filtroStatus === 'pendentes' && d.pago) return false
        if (filtroStatus === 'pagas' && !d.pago) return false
        if (busca) {
          const t = busca.toLowerCase()
          return d.nome.toLowerCase().includes(t) || (d.fornecedor || '').toLowerCase().includes(t)
        }
        return true
      })
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
  }, [despesas, dataDe, dataAte, busca, filtroStatus])

  const resumo = useMemo(() => {
    const pagas = filtered.filter(d => d.pago)
    const pendentes = filtered.filter(d => !d.pago)
    const atrasadas = filtered.filter(d => !d.pago && d.vencimento < hoje)
    return {
      totalPago: pagas.reduce((s, d) => s + d.valor, 0),
      totalPendente: pendentes.reduce((s, d) => s + d.valor, 0),
      totalAtrasado: atrasadas.reduce((s, d) => s + d.valor, 0),
    }
  }, [filtered, hoje])

  const isAtrasada = (d: { pago: boolean; vencimento: string }) => !d.pago && d.vencimento < hoje

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Despesas</h1>
            <p className="text-sm text-gray-500">{filtered.length} registro(s)</p>
          </div>
          <button onClick={() => navigate('/app/despesas/novo')} className="btn-primary">
            <Plus size={18} /> Nova Despesa
          </button>
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Vencimento de</label>
              <input type="date" value={dataDe} onChange={e => setDataDe(e.target.value)} className="input-field" />
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Vencimento ate</label>
              <input type="date" value={dataAte} onChange={e => setDataAte(e.target.value)} className="input-field" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
                  placeholder="Nome ou fornecedor" className="input-field pl-9" />
              </div>
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)} className="input-field">
                <option value="todas">Todas</option>
                <option value="pendentes">Pendentes</option>
                <option value="pagas">Pagas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xs text-gray-500">Pago</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(resumo.totalPago)}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-gray-500">A Pagar</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(resumo.totalPendente)}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-gray-500">Atrasadas</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(resumo.totalAtrasado)}</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16">
            <Receipt size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma despesa encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(d => (
              <div key={d._id} className={`card p-4 flex items-center gap-4 ${isAtrasada(d) ? 'border-red-200 bg-red-50/50' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  d.pago ? 'bg-green-100 text-green-600' : isAtrasada(d) ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {d.pago ? <Check size={18} /> : isAtrasada(d) ? <AlertTriangle size={18} /> : <Receipt size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">{d.nome}</p>
                    <span className="badge badge-info">{d.tipo === 'fixa' ? 'Fixa' : 'Variavel'}</span>
                    {d.pago && <span className="badge badge-green">Pago</span>}
                    {isAtrasada(d) && <span className="badge badge-red">Atrasada</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    {d.fornecedor && <span>{d.fornecedor}</span>}
                    <span>Venc: {formatDate(d.vencimento)}</span>
                    {d.pagoEm && <span>Pago em: {formatDate(d.pagoEm)}</span>}
                  </div>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${d.pago ? 'text-green-600' : 'text-gray-800'}`}>
                  {formatCurrency(d.valor)}
                </p>
                <div className="flex gap-1 flex-shrink-0">
                  {!d.pago && (
                    <button onClick={() => pagarDespesa(d._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Pagar">
                      <Check size={16} />
                    </button>
                  )}
                  <button onClick={() => navigate(`/app/despesas/${d._id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors" title="Editar">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => setConfirmDelete(d._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Remover">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar exclusao</h3>
            <p className="text-sm text-gray-600 mb-6">Tem certeza que deseja remover esta despesa?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => { removeDespesa(confirmDelete); setConfirmDelete(null) }} className="btn-danger flex-1">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
