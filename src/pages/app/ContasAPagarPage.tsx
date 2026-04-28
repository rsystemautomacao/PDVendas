import { useState, useMemo } from 'react'
import { Search, Plus, DollarSign, Check, Trash2, AlertTriangle } from 'lucide-react'
import { useFinanceiro } from '../../contexts/FinanceiroContext'
import { TutorialModal } from '../../components/app/TutorialModal'
import { tutorialContasPagar } from '../../config/tutorials'
import { formatCurrency, formatDate } from '../../utils/helpers'

export function ContasAPagarPage() {
  const { contasPagar, addContaPagar, pagarConta, removeContaPagar } = useFinanceiro()

  const hoje = new Date().toISOString().substring(0, 10)
  const mesInicio = hoje.substring(0, 7) + '-01'
  const mesFim = hoje.substring(0, 7) + '-31'

  const [dataDe, setDataDe] = useState(mesInicio)
  const [dataAte, setDataAte] = useState(mesFim)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'pendentes' | 'pagas' | 'atrasadas'>('todas')

  const [showAddModal, setShowAddModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novoFornecedor, setNovoFornecedor] = useState('')
  const [novoValor, setNovoValor] = useState('')
  const [novoVencimento, setNovoVencimento] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('')

  const filtered = useMemo(() => {
    return contasPagar
      .filter(c => {
        if (dataDe && c.vencimento < dataDe) return false
        if (dataAte && c.vencimento > dataAte) return false
        if (filtroStatus === 'pendentes' && c.pago) return false
        if (filtroStatus === 'pagas' && !c.pago) return false
        if (filtroStatus === 'atrasadas' && (c.pago || c.vencimento >= hoje)) return false
        if (busca) {
          const t = busca.toLowerCase()
          return c.descricao.toLowerCase().includes(t) || (c.fornecedor || '').toLowerCase().includes(t)
        }
        return true
      })
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
  }, [contasPagar, dataDe, dataAte, busca, filtroStatus, hoje])

  const resumo = useMemo(() => {
    const pagas = filtered.filter(c => c.pago)
    const pendentes = filtered.filter(c => !c.pago)
    const atrasadas = filtered.filter(c => !c.pago && c.vencimento < hoje)
    return {
      totalPago: pagas.reduce((s, c) => s + c.valorPago, 0),
      totalPendente: pendentes.reduce((s, c) => s + c.valor, 0),
      totalAtrasado: atrasadas.reduce((s, c) => s + c.valor, 0),
      qtdAtrasadas: atrasadas.length,
    }
  }, [filtered, hoje])

  const handleAdd = () => {
    if (!novaDescricao.trim() || !novoValor || !novoVencimento) return
    addContaPagar({
      descricao: novaDescricao.trim(),
      fornecedor: novoFornecedor.trim() || undefined,
      valor: parseFloat(novoValor) || 0,
      valorPago: 0,
      vencimento: novoVencimento,
      pago: false,
      categoria: novaCategoria.trim() || undefined,
    })
    setShowAddModal(false)
    setNovaDescricao(''); setNovoFornecedor(''); setNovoValor(''); setNovoVencimento(''); setNovaCategoria('')
  }

  const isAtrasada = (c: { pago: boolean; vencimento: string }) => !c.pago && c.vencimento < hoje

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Contas a Pagar</h1>
            <p className="text-sm text-gray-500">{filtered.length} registro(s)</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={18} /> Nova Conta
          </button>
        </div>

        {/* Filters */}
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
                  placeholder="Descricao ou fornecedor" className="input-field pl-9" />
              </div>
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)} className="input-field">
                <option value="todas">Todas</option>
                <option value="pendentes">Pendentes</option>
                <option value="pagas">Pagas</option>
                <option value="atrasadas">Atrasadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumo */}
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
            <p className="text-xs text-gray-500">Atrasadas ({resumo.qtdAtrasadas})</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(resumo.totalAtrasado)}</p>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16">
            <DollarSign size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma conta encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c._id} className={`card p-4 flex items-center gap-4 ${isAtrasada(c) ? 'border-red-200 bg-red-50/50' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  c.pago ? 'bg-green-100 text-green-600' : isAtrasada(c) ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {c.pago ? <Check size={18} /> : isAtrasada(c) ? <AlertTriangle size={18} /> : <DollarSign size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">{c.descricao}</p>
                    {c.pago && <span className="badge badge-green">Pago</span>}
                    {isAtrasada(c) && <span className="badge badge-red">Atrasada</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    {c.fornecedor && <span>{c.fornecedor}</span>}
                    <span>Venc: {formatDate(c.vencimento)}</span>
                    {c.categoria && <span>{c.categoria}</span>}
                    {c.pagoEm && <span>Pago em: {formatDate(c.pagoEm)}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${c.pago ? 'text-green-600' : isAtrasada(c) ? 'text-red-500' : 'text-gray-800'}`}>
                    {formatCurrency(c.valor)}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!c.pago && (
                    <button onClick={() => pagarConta(c._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                      title="Marcar como pago">
                      <Check size={16} />
                    </button>
                  )}
                  <button onClick={() => setConfirmDelete(c._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remover">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nova Conta a Pagar</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Descricao *</label>
                <input type="text" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)}
                  placeholder="Ex: Aluguel do mes" className="input-field" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Valor *</label>
                  <input type="number" step="0.01" value={novoValor} onChange={e => setNovoValor(e.target.value)}
                    placeholder="0.00" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Vencimento *</label>
                  <input type="date" value={novoVencimento} onChange={e => setNovoVencimento(e.target.value)}
                    className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Fornecedor</label>
                <input type="text" value={novoFornecedor} onChange={e => setNovoFornecedor(e.target.value)}
                  placeholder="Fornecedor" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Categoria</label>
                <input type="text" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)}
                  placeholder="Ex: Aluguel, Utilidades" className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleAdd} disabled={!novaDescricao.trim() || !novoValor || !novoVencimento}
                className="btn-primary flex-1">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar exclusao</h3>
            <p className="text-sm text-gray-600 mb-6">Tem certeza que deseja remover esta conta?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => { removeContaPagar(confirmDelete); setConfirmDelete(null) }} className="btn-danger flex-1">Remover</button>
            </div>
          </div>
        </div>
      )}
      <TutorialModal id="contas-pagar" titulo="Contas a Pagar" subtitulo="Controle suas despesas e pagamentos" steps={tutorialContasPagar} />
    </div>
  )
}
