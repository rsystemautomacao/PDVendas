import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ShoppingCart, Eye, XCircle, Printer, X } from 'lucide-react'
import { useVendas } from '../../contexts/VendaContext'
import { formatCurrency, formatDateTime } from '../../utils/helpers'
import type { Venda } from '../../types'

const formaLabel: Record<string, string> = {
  dinheiro: 'Dinheiro',
  credito: 'Cartao Credito',
  debito: 'Cartao Debito',
  pix: 'PIX',
  boleto: 'Boleto',
  crediario: 'Crediario',
}

export function VendasPage() {
  const navigate = useNavigate()
  const { vendas, cancelarVenda, carregarSeNecessario: carregarVendas } = useVendas()
  useEffect(() => { carregarVendas() }, [carregarVendas])

  const hoje = new Date().toISOString().substring(0, 10)
  const mesInicio = hoje.substring(0, 7) + '-01'

  const [dataDe, setDataDe] = useState(mesInicio)
  const [dataAte, setDataAte] = useState(hoje)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'finalizada' | 'cancelada'>('todas')

  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)
  const [cancelModal, setCancelModal] = useState<string | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')

  const filtered = useMemo(() => {
    return vendas
      .filter(v => {
        const dataVenda = v.criadoEm.substring(0, 10)
        if (dataDe && dataVenda < dataDe) return false
        if (dataAte && dataVenda > dataAte) return false
        if (filtroStatus !== 'todas' && v.status !== filtroStatus) return false
        if (busca) {
          const t = busca.toLowerCase()
          return (
            String(v.numero).includes(t) ||
            (v.clienteNome || '').toLowerCase().includes(t) ||
            (v.vendedorNome || '').toLowerCase().includes(t)
          )
        }
        return true
      })
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }, [vendas, dataDe, dataAte, busca, filtroStatus])

  const resumo = useMemo(() => {
    const finalizadas = filtered.filter(v => v.status === 'finalizada')
    return {
      total: finalizadas.reduce((s, v) => s + v.total, 0),
      quantidade: finalizadas.length,
      canceladas: filtered.filter(v => v.status === 'cancelada').length,
    }
  }, [filtered])

  const handleCancelar = () => {
    if (!cancelModal || !motivoCancelamento.trim()) return
    cancelarVenda(cancelModal, motivoCancelamento.trim())
    setCancelModal(null)
    setMotivoCancelamento('')
    setVendaSelecionada(null)
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'finalizada': return <span className="badge badge-green">Finalizada</span>
      case 'cancelada': return <span className="badge badge-red">Cancelada</span>
      case 'orcamento': return <span className="badge badge-yellow">Orcamento</span>
      default: return <span className="badge badge-gray">{status}</span>
    }
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Vendas</h1>
            <p className="text-sm text-gray-500">{filtered.length} registro(s)</p>
          </div>
          <button onClick={() => navigate('/app/novo-pedido')} className="btn-primary">
            <Plus size={18} /> Nova Venda
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data de</label>
              <input type="date" value={dataDe} onChange={e => setDataDe(e.target.value)} className="input-field" />
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data ate</label>
              <input type="date" value={dataAte} onChange={e => setDataAte(e.target.value)} className="input-field" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
                  placeholder="Numero, cliente ou vendedor" className="input-field pl-9" />
              </div>
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)} className="input-field">
                <option value="todas">Todas</option>
                <option value="finalizada">Finalizadas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xs text-gray-500">Total Vendas</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(resumo.total)}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-gray-500">Quantidade</p>
            <p className="text-lg font-bold text-gray-800">{resumo.quantidade}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-gray-500">Canceladas</p>
            <p className="text-lg font-bold text-red-500">{resumo.canceladas}</p>
          </div>
        </div>

        {/* Sales List */}
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16">
            <ShoppingCart size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma venda encontrada</p>
            <p className="text-sm text-gray-400 mt-1">Ajuste os filtros ou realize uma nova venda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(v => (
              <div key={v._id}
                className="card p-4 flex items-center gap-4 hover:border-primary/20 transition-colors cursor-pointer"
                onClick={() => setVendaSelecionada(v)}>
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">#{v.numero}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {v.clienteNome || 'Consumidor Final'}
                    </p>
                    {statusBadge(v.status)}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    <span>{formatDateTime(v.criadoEm)}</span>
                    <span>{v.itens.length} item(s)</span>
                    <span>Vendedor: {v.vendedorNome}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${v.status === 'cancelada' ? 'text-gray-400 line-through' : 'text-green-600'}`}>
                    {formatCurrency(v.total)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {v.pagamentos.map(p => formaLabel[p.forma] || p.forma).join(', ')}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setVendaSelecionada(v)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                    title="Ver detalhes">
                    <Eye size={16} />
                  </button>
                  {v.status === 'finalizada' && (
                    <button onClick={() => setCancelModal(v._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Cancelar venda">
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {vendaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setVendaSelecionada(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">Venda #{vendaSelecionada.numero}</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                  <Printer size={16} />
                </button>
                <button onClick={() => setVendaSelecionada(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Data:</span>
                  <p className="font-medium">{formatDateTime(vendaSelecionada.criadoEm)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="mt-0.5">{statusBadge(vendaSelecionada.status)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Cliente:</span>
                  <p className="font-medium">{vendaSelecionada.clienteNome || 'Consumidor Final'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Vendedor:</span>
                  <p className="font-medium">{vendaSelecionada.vendedorNome}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Itens</p>
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                  {vendaSelecionada.itens.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{item.nome}</p>
                        <p className="text-xs text-gray-400">{item.quantidade}x {formatCurrency(item.precoUnitario)}</p>
                      </div>
                      <p className="font-semibold text-gray-800 flex-shrink-0 ml-2">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(vendaSelecionada.subtotal)}</span>
                </div>
                {vendaSelecionada.desconto > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Desconto</span>
                    <span>-{formatCurrency(vendaSelecionada.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(vendaSelecionada.total)}</span>
                </div>
                {vendaSelecionada.troco > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Troco</span>
                    <span>{formatCurrency(vendaSelecionada.troco)}</span>
                  </div>
                )}
              </div>

              {/* Payments */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Pagamentos</p>
                <div className="space-y-1">
                  {vendaSelecionada.pagamentos.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span>{formaLabel[p.forma] || p.forma}{p.parcelas && p.parcelas > 1 ? ` (${p.parcelas}x)` : ''}</span>
                      <span className="font-medium">{formatCurrency(p.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancelamento info */}
              {vendaSelecionada.status === 'cancelada' && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                  <p className="font-semibold text-red-700">Venda cancelada</p>
                  {vendaSelecionada.canceladoEm && <p className="text-red-600 text-xs">Em: {formatDateTime(vendaSelecionada.canceladoEm)}</p>}
                  {vendaSelecionada.motivoCancelamento && <p className="text-red-600 mt-1">Motivo: {vendaSelecionada.motivoCancelamento}</p>}
                </div>
              )}

              {vendaSelecionada.observacoes && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Obs:</span> {vendaSelecionada.observacoes}
                </div>
              )}

              {/* Actions */}
              {vendaSelecionada.status === 'finalizada' && (
                <button onClick={() => { setCancelModal(vendaSelecionada._id); setVendaSelecionada(null) }}
                  className="btn-danger w-full">
                  <XCircle size={16} /> Cancelar Venda
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Cancelar Venda</h3>
            <p className="text-sm text-gray-600 mb-4">Informe o motivo do cancelamento. O estoque dos produtos sera restaurado.</p>
            <textarea value={motivoCancelamento} onChange={e => setMotivoCancelamento(e.target.value)}
              placeholder="Motivo do cancelamento..." rows={3}
              className="input-field resize-none mb-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => { setCancelModal(null); setMotivoCancelamento('') }} className="btn-secondary flex-1">Voltar</button>
              <button onClick={handleCancelar} disabled={!motivoCancelamento.trim()} className="btn-danger flex-1">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
