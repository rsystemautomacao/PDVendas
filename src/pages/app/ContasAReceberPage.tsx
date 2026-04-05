import { useState, useMemo } from 'react'
import { Search, Plus, DollarSign, Check, Trash2, AlertTriangle } from 'lucide-react'
import { useFinanceiro } from '../../contexts/FinanceiroContext'
import { formatCurrency, formatDate } from '../../utils/helpers'

export function ContasAReceberPage() {
  const { contasReceber, addContaReceber, receberConta, removeContaReceber } = useFinanceiro()

  const hoje = new Date().toISOString().substring(0, 10)
  const mesInicio = hoje.substring(0, 7) + '-01'
  const mesFim = hoje.substring(0, 7) + '-31'

  const [dataDe, setDataDe] = useState(mesInicio)
  const [dataAte, setDataAte] = useState(mesFim)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'pendentes' | 'recebidas' | 'atrasadas'>('todas')

  const [showAddModal, setShowAddModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novoCliente, setNovoCliente] = useState('')
  const [novoValor, setNovoValor] = useState('')
  const [novoVencimento, setNovoVencimento] = useState('')

  const filtered = useMemo(() => {
    return contasReceber
      .filter(c => {
        if (dataDe && c.vencimento < dataDe) return false
        if (dataAte && c.vencimento > dataAte) return false
        if (filtroStatus === 'pendentes' && c.recebido) return false
        if (filtroStatus === 'recebidas' && !c.recebido) return false
        if (filtroStatus === 'atrasadas' && (c.recebido || c.vencimento >= hoje)) return false
        if (busca) {
          const t = busca.toLowerCase()
          return c.descricao.toLowerCase().includes(t) || (c.clienteNome || '').toLowerCase().includes(t)
        }
        return true
      })
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
  }, [contasReceber, dataDe, dataAte, busca, filtroStatus, hoje])

  const resumo = useMemo(() => {
    const recebidas = filtered.filter(c => c.recebido)
    const pendentes = filtered.filter(c => !c.recebido)
    const atrasadas = filtered.filter(c => !c.recebido && c.vencimento < hoje)
    return {
      totalRecebido: recebidas.reduce((s, c) => s + c.valorRecebido, 0),
      totalPendente: pendentes.reduce((s, c) => s + c.valor, 0),
      totalAtrasado: atrasadas.reduce((s, c) => s + c.valor, 0),
      qtdAtrasadas: atrasadas.length,
    }
  }, [filtered, hoje])

  const handleAdd = () => {
    if (!novaDescricao.trim() || !novoValor || !novoVencimento) return
    addContaReceber({
      descricao: novaDescricao.trim(),
      clienteNome: novoCliente.trim() || undefined,
      valor: parseFloat(novoValor) || 0,
      valorRecebido: 0,
      vencimento: novoVencimento,
      recebido: false,
    })
    setShowAddModal(false)
    setNovaDescricao(''); setNovoCliente(''); setNovoValor(''); setNovoVencimento('')
  }

  const isAtrasada = (c: { recebido: boolean; vencimento: string }) => !c.recebido && c.vencimento < hoje

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Contas a Receber</h1>
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
                  placeholder="Descricao ou cliente" className="input-field pl-9" />
              </div>
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)} className="input-field">
                <option value="todas">Todas</option>
                <option value="pendentes">Pendentes</option>
                <option value="recebidas">Recebidas</option>
                <option value="atrasadas">Atrasadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xs text-gray-500">Recebido</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(resumo.totalRecebido)}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-gray-500">A Receber</p>
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
                  c.recebido ? 'bg-green-100 text-green-600' : isAtrasada(c) ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {c.recebido ? <Check size={18} /> : isAtrasada(c) ? <AlertTriangle size={18} /> : <DollarSign size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">{c.descricao}</p>
                    {c.recebido && <span className="badge badge-green">Recebido</span>}
                    {isAtrasada(c) && <span className="badge badge-red">Atrasada</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    {c.clienteNome && <span>{c.clienteNome}</span>}
                    <span>Venc: {formatDate(c.vencimento)}</span>
                    {c.recebidoEm && <span>Recebido em: {formatDate(c.recebidoEm)}</span>}
                    {c.parcela && c.totalParcelas ? <span className="text-primary font-medium">Parcela {c.parcela}/{c.totalParcelas}</span> : null}
                    {c.vendaNumero ? <span>Venda #{c.vendaNumero}</span> : null}
                    {c.origem === 'crediario' && <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">Crediario</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${c.recebido ? 'text-green-600' : isAtrasada(c) ? 'text-red-500' : 'text-gray-800'}`}>
                    {formatCurrency(c.valor)}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!c.recebido && (
                    <button onClick={() => receberConta(c._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                      title="Marcar como recebido">
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
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nova Conta a Receber</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Descricao *</label>
                <input type="text" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)}
                  placeholder="Ex: Venda a prazo" className="input-field" autoFocus />
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
                <label className="text-sm font-medium text-gray-700 mb-1 block">Cliente</label>
                <input type="text" value={novoCliente} onChange={e => setNovoCliente(e.target.value)}
                  placeholder="Nome do cliente" className="input-field" />
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
              <button onClick={() => { removeContaReceber(confirmDelete); setConfirmDelete(null) }} className="btn-danger flex-1">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
