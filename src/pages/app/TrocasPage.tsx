import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search, Plus, RefreshCw, ArrowLeftRight, ArrowDownLeft,
  Check, X, Eye, Package,
} from 'lucide-react'
import { api } from '../../services/api'
import { useVendas } from '../../contexts/VendaContext'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../utils/helpers'
import type { Troca, Venda, ItemVenda } from '../../types'

export function TrocasPage() {
  const toast = useToast()
  const { vendas, carregarSeNecessario: carregarVendas } = useVendas()
  useEffect(() => { carregarVendas() }, [carregarVendas])
  const { produtos } = useProdutos()

  const [trocas, setTrocas] = useState<Troca[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'troca' | 'devolucao'>('todas')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'aprovada' | 'recusada'>('todos')

  // Create modal
  const [showModal, setShowModal] = useState(false)
  const [tipo, setTipo] = useState<'troca' | 'devolucao'>('devolucao')
  const [vendaNumeroInput, setVendaNumeroInput] = useState('')
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)
  const [itensParaDevolver, setItensParaDevolver] = useState<Record<string, number>>({})
  const [itensNovos, setItensNovos] = useState<{ produtoId: string; nome: string; codigo: string; quantidade: number; precoUnitario: number }[]>([])
  const [motivo, setMotivo] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [buscaProdutoNovo, setBuscaProdutoNovo] = useState('')

  // Detail modal
  const [trocaDetalhe, setTrocaDetalhe] = useState<Troca | null>(null)

  const fetchTrocas = useCallback(async () => {
    try {
      const res = await api.get('/trocas')
      if (res.success) setTrocas(res.data || [])
    } catch (err: any) {
      toast.erro(err.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchTrocas() }, [fetchTrocas])

  const filtered = useMemo(() => {
    return trocas.filter(t => {
      if (filtroTipo !== 'todas' && t.tipo !== filtroTipo) return false
      if (filtroStatus !== 'todos' && t.status !== filtroStatus) return false
      if (busca) {
        const term = busca.toLowerCase()
        return (
          String(t.numero).includes(term) ||
          String(t.vendaNumero).includes(term) ||
          (t.clienteNome || '').toLowerCase().includes(term) ||
          t.motivo.toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [trocas, filtroTipo, filtroStatus, busca])

  const buscarVenda = () => {
    const num = Number(vendaNumeroInput)
    const venda = vendas.find(v => v.numero === num && v.status === 'finalizada')
    if (!venda) {
      toast.erro('Venda nao encontrada ou nao esta finalizada')
      return
    }
    setVendaSelecionada(venda)
    setItensParaDevolver({})
  }

  const toggleItemDevolver = (item: ItemVenda, qty: number) => {
    setItensParaDevolver(prev => {
      if (qty <= 0) {
        const next = { ...prev }
        delete next[item.produtoId]
        return next
      }
      return { ...prev, [item.produtoId]: Math.min(qty, item.quantidade) }
    })
  }

  const totalDevolvido = useMemo(() => {
    if (!vendaSelecionada) return 0
    return vendaSelecionada.itens.reduce((sum, item) => {
      const qty = itensParaDevolver[item.produtoId] || 0
      return sum + qty * item.precoUnitario
    }, 0)
  }, [vendaSelecionada, itensParaDevolver])

  const totalNovo = useMemo(() => {
    return itensNovos.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0)
  }, [itensNovos])

  const produtosFiltrados = useMemo(() => {
    if (!buscaProdutoNovo.trim()) return []
    const term = buscaProdutoNovo.toLowerCase()
    return produtos.filter(p => p.ativo && (p.nome.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term))).slice(0, 8)
  }, [produtos, buscaProdutoNovo])

  const addItemNovo = (produtoId: string, nome: string, codigo: string, preco: number) => {
    const existing = itensNovos.find(i => i.produtoId === produtoId)
    if (existing) {
      setItensNovos(prev => prev.map(i => i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + 1 } : i))
    } else {
      setItensNovos(prev => [...prev, { produtoId, nome, codigo, quantidade: 1, precoUnitario: preco }])
    }
    setBuscaProdutoNovo('')
  }

  const removeItemNovo = (produtoId: string) => {
    setItensNovos(prev => prev.filter(i => i.produtoId !== produtoId))
  }

  const handleSalvar = async () => {
    if (!vendaSelecionada) return
    const devolvidos = vendaSelecionada.itens
      .filter(item => (itensParaDevolver[item.produtoId] || 0) > 0)
      .map(item => ({
        produtoId: item.produtoId,
        nome: item.nome,
        codigo: item.codigo,
        quantidade: itensParaDevolver[item.produtoId],
        precoUnitario: item.precoUnitario,
        total: itensParaDevolver[item.produtoId] * item.precoUnitario,
      }))

    if (devolvidos.length === 0) {
      toast.erro('Selecione ao menos 1 item para devolver')
      return
    }
    if (!motivo.trim()) {
      toast.erro('Informe o motivo')
      return
    }

    const novos = itensNovos.map(i => ({ ...i, total: i.quantidade * i.precoUnitario }))

    setSalvando(true)
    try {
      await api.post('/trocas', {
        vendaId: vendaSelecionada._id,
        vendaNumero: vendaSelecionada.numero,
        clienteNome: vendaSelecionada.clienteNome || '',
        tipo,
        itensDevolvidos: devolvidos,
        itensNovos: novos,
        totalDevolvido: totalDevolvido,
        totalNovo: totalNovo,
        diferenca: totalNovo - totalDevolvido,
        motivo: motivo.trim(),
        observacoes: observacoes.trim(),
      })
      toast.sucesso(`${tipo === 'troca' ? 'Troca' : 'Devolucao'} registrada com sucesso!`)
      setShowModal(false)
      resetForm()
      fetchTrocas()
    } catch (err: any) {
      toast.erro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const handleAprovar = async (id: string, status: 'aprovada' | 'recusada') => {
    try {
      await api.put(`/trocas/${id}/status`, { status })
      toast.sucesso(status === 'aprovada' ? 'Aprovada com sucesso!' : 'Recusada.')
      fetchTrocas()
      setTrocaDetalhe(null)
    } catch (err: any) {
      toast.erro(err.message)
    }
  }

  const resetForm = () => {
    setVendaNumeroInput('')
    setVendaSelecionada(null)
    setItensParaDevolver({})
    setItensNovos([])
    setMotivo('')
    setObservacoes('')
    setTipo('devolucao')
    setBuscaProdutoNovo('')
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pendente': return <span className="badge badge-yellow">Pendente</span>
      case 'aprovada': return <span className="badge badge-green">Aprovada</span>
      case 'recusada': return <span className="badge badge-red">Recusada</span>
      default: return <span className="badge badge-gray">{status}</span>
    }
  }

  const tipoBadge = (tipo: string) => {
    return tipo === 'troca'
      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full"><ArrowLeftRight size={12} />Troca</span>
      : <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full"><ArrowDownLeft size={12} />Devolucao</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <RefreshCw size={22} className="text-primary" /> Trocas e Devoluções
          </h1>
          <p className="text-sm text-gray-500 mt-1">{trocas.length} registro(s)</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Nova Troca/Devolucao
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text" placeholder="Buscar por numero, cliente, motivo..."
            value={busca} onChange={e => setBusca(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as any)} className="input-field text-sm">
          <option value="todas">Todas</option>
          <option value="troca">Trocas</option>
          <option value="devolucao">Devoluções</option>
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as any)} className="input-field text-sm">
          <option value="todos">Todos status</option>
          <option value="pendente">Pendentes</option>
          <option value="aprovada">Aprovadas</option>
          <option value="recusada">Recusadas</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <RefreshCw size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma troca/devolucao encontrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Venda</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Cliente</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Devolvido</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Novo</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Data</th>
                  <th className="px-4 py-3 text-center">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t._id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-700">{t.numero}</td>
                    <td className="px-4 py-3">{tipoBadge(t.tipo)}</td>
                    <td className="px-4 py-3 text-gray-600">#{t.vendaNumero}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{t.clienteNome || '-'}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium hidden md:table-cell">{formatCurrency(t.totalDevolvido)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium hidden md:table-cell">{t.totalNovo > 0 ? formatCurrency(t.totalNovo) : '-'}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(t.status)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{new Date(t.criadoEm).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setTrocaDetalhe(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Nova Troca/Devolucao</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tipo */}
              <div className="flex gap-3">
                <button
                  onClick={() => setTipo('devolucao')}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${tipo === 'devolucao' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <ArrowDownLeft size={16} className="inline mr-1" /> Devolucao
                </button>
                <button
                  onClick={() => setTipo('troca')}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${tipo === 'troca' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <ArrowLeftRight size={16} className="inline mr-1" /> Troca
                </button>
              </div>

              {/* Buscar venda */}
              <div>
                <label className="label">Numero da venda original</label>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Ex: 42"
                    value={vendaNumeroInput} onChange={e => setVendaNumeroInput(e.target.value)}
                    className="input-field flex-1"
                    onKeyDown={e => e.key === 'Enter' && buscarVenda()}
                  />
                  <button onClick={buscarVenda} className="btn-primary px-4">
                    <Search size={16} /> Buscar
                  </button>
                </div>
              </div>

              {/* Venda encontrada */}
              {vendaSelecionada && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <p className="font-semibold text-gray-700">Venda #{vendaSelecionada.numero}</p>
                    <p className="text-gray-500">Cliente: {vendaSelecionada.clienteNome || 'Consumidor'} | Total: {formatCurrency(vendaSelecionada.total)}</p>
                    <p className="text-gray-400 text-xs">Data: {new Date(vendaSelecionada.criadoEm).toLocaleDateString('pt-BR')}</p>
                  </div>

                  {/* Itens para devolver */}
                  <div>
                    <label className="label">Itens a devolver</label>
                    <div className="space-y-2">
                      {vendaSelecionada.itens.map(item => {
                        const qty = itensParaDevolver[item.produtoId] || 0
                        return (
                          <div key={item.produtoId} className="flex items-center gap-3 bg-white border rounded-xl px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={qty > 0}
                              onChange={e => toggleItemDevolver(item, e.target.checked ? item.quantidade : 0)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{item.nome}</p>
                              <p className="text-xs text-gray-400">{formatCurrency(item.precoUnitario)} un</p>
                            </div>
                            {qty > 0 && (
                              <input
                                type="number" min={1} max={item.quantidade} value={qty}
                                onChange={e => toggleItemDevolver(item, Number(e.target.value))}
                                className="w-16 input-field text-center text-sm py-1"
                              />
                            )}
                            <span className="text-xs text-gray-400">max: {item.quantidade}</span>
                          </div>
                        )
                      })}
                    </div>
                    {totalDevolvido > 0 && (
                      <p className="text-sm font-semibold text-red-600 mt-2">Total devolvido: {formatCurrency(totalDevolvido)}</p>
                    )}
                  </div>

                  {/* Itens novos (se troca) */}
                  {tipo === 'troca' && (
                    <div>
                      <label className="label">Itens novos (troca por)</label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text" placeholder="Buscar produto para trocar..."
                          value={buscaProdutoNovo} onChange={e => setBuscaProdutoNovo(e.target.value)}
                          className="input-field pl-9 text-sm"
                        />
                        {produtosFiltrados.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                            {produtosFiltrados.map(p => (
                              <button key={p._id} onClick={() => addItemNovo(p._id, p.nome, p.codigo, p.preco)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b last:border-0 flex justify-between">
                                <span>{p.nome}</span>
                                <span className="text-primary font-medium">{formatCurrency(p.preco)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {itensNovos.length > 0 && (
                        <div className="space-y-2">
                          {itensNovos.map(item => (
                            <div key={item.produtoId} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                              <Package size={14} className="text-green-600" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{item.nome}</p>
                                <p className="text-xs text-gray-400">{formatCurrency(item.precoUnitario)} un</p>
                              </div>
                              <input
                                type="number" min={1} value={item.quantidade}
                                onChange={e => setItensNovos(prev => prev.map(i => i.produtoId === item.produtoId ? { ...i, quantidade: Number(e.target.value) || 1 } : i))}
                                className="w-16 input-field text-center text-sm py-1"
                              />
                              <button onClick={() => removeItemNovo(item.produtoId)} className="text-red-400 hover:text-red-600">
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                          <p className="text-sm font-semibold text-green-600">Total novo: {formatCurrency(totalNovo)}</p>
                        </div>
                      )}
                      {totalDevolvido > 0 && (
                        <div className="mt-2 p-3 rounded-xl bg-gray-50 text-sm">
                          <span className="text-gray-600">Diferenca: </span>
                          <span className={`font-bold ${totalNovo - totalDevolvido > 0 ? 'text-red-600' : totalNovo - totalDevolvido < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {totalNovo - totalDevolvido > 0 ? `Cliente paga ${formatCurrency(totalNovo - totalDevolvido)}` : totalNovo - totalDevolvido < 0 ? `Devolver ${formatCurrency(Math.abs(totalNovo - totalDevolvido))} ao cliente` : 'Sem diferenca'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Motivo */}
                  <div>
                    <label className="label">Motivo *</label>
                    <select value={motivo} onChange={e => setMotivo(e.target.value)} className="input-field text-sm">
                      <option value="">Selecione...</option>
                      <option value="Defeito de fabricacao">Defeito de fabricacao</option>
                      <option value="Produto com avaria">Produto com avaria</option>
                      <option value="Tamanho/modelo errado">Tamanho/modelo errado</option>
                      <option value="Insatisfacao do cliente">Insatisfacao do cliente</option>
                      <option value="Produto diferente do pedido">Produto diferente do pedido</option>
                      <option value="Arrependimento de compra">Arrependimento de compra</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  {/* Observacoes */}
                  <div>
                    <label className="label">Observacoes</label>
                    <textarea
                      value={observacoes} onChange={e => setObservacoes(e.target.value)}
                      className="input-field text-sm" rows={2} placeholder="Detalhes adicionais..."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={handleSalvar}
                disabled={!vendaSelecionada || salvando}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {trocaDetalhe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {trocaDetalhe.tipo === 'troca' ? 'Troca' : 'Devolucao'} #{trocaDetalhe.numero}
              </h2>
              <button onClick={() => setTrocaDetalhe(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                {tipoBadge(trocaDetalhe.tipo)}
                {statusBadge(trocaDetalhe.status)}
              </div>
              <div className="text-sm space-y-1 text-gray-600">
                <p>Venda: <strong>#{trocaDetalhe.vendaNumero}</strong></p>
                <p>Cliente: <strong>{trocaDetalhe.clienteNome || 'Consumidor'}</strong></p>
                <p>Operador: <strong>{trocaDetalhe.operadorNome || '-'}</strong></p>
                {trocaDetalhe.aprovadoPor && <p>Aprovado por: <strong>{trocaDetalhe.aprovadoPor}</strong></p>}
                <p>Data: <strong>{new Date(trocaDetalhe.criadoEm).toLocaleString('pt-BR')}</strong></p>
              </div>

              <div>
                <p className="font-semibold text-sm text-red-600 mb-1">Itens Devolvidos:</p>
                {trocaDetalhe.itensDevolvidos.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-dashed">
                    <span>{item.nome} x{item.quantidade}</span>
                    <span className="text-red-600">{formatCurrency(item.total)}</span>
                  </div>
                ))}
                <p className="text-sm font-bold text-red-600 mt-1">Total: {formatCurrency(trocaDetalhe.totalDevolvido)}</p>
              </div>

              {trocaDetalhe.itensNovos.length > 0 && (
                <div>
                  <p className="font-semibold text-sm text-green-600 mb-1">Itens Novos:</p>
                  {trocaDetalhe.itensNovos.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-dashed">
                      <span>{item.nome} x{item.quantidade}</span>
                      <span className="text-green-600">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <p className="text-sm font-bold text-green-600 mt-1">Total: {formatCurrency(trocaDetalhe.totalNovo)}</p>
                </div>
              )}

              {trocaDetalhe.diferenca !== 0 && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${trocaDetalhe.diferenca > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {trocaDetalhe.diferenca > 0 ? `Cliente paga: ${formatCurrency(trocaDetalhe.diferenca)}` : `Devolver ao cliente: ${formatCurrency(Math.abs(trocaDetalhe.diferenca))}`}
                </div>
              )}

              <div className="text-sm">
                <p className="text-gray-500">Motivo: <strong>{trocaDetalhe.motivo}</strong></p>
                {trocaDetalhe.observacoes && <p className="text-gray-400 mt-1">{trocaDetalhe.observacoes}</p>}
              </div>

              {trocaDetalhe.status === 'pendente' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => handleAprovar(trocaDetalhe._id, 'recusada')}
                    className="flex-1 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                    <X size={16} /> Recusar
                  </button>
                  <button onClick={() => handleAprovar(trocaDetalhe._id, 'aprovada')}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <Check size={16} /> Aprovar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
