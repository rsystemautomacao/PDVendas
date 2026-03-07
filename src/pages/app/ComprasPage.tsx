import { useState, useCallback, useMemo, useEffect } from 'react'
import { Search, X, Printer, Plus, Eye, PackageCheck, Trash2, ShoppingBag } from 'lucide-react'
import { api } from '../../services/api'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatDateTime, todayDateOnly } from '../../utils/helpers'
import type { Compra, ItemCompra, Produto } from '../../types'

export function ComprasPage() {
  const { produtos, recarregar: recarregarProdutos } = useProdutos()
  const { sucesso, erro } = useToast()
  const [compras, setCompras] = useState<Compra[]>([])
  const [loadingCompras, setLoadingCompras] = useState(true)

  // Filtros
  const hoje = todayDateOnly()
  const mesInicio = hoje.substring(0, 7) + '-01'
  const [dataDe, setDataDe] = useState(mesInicio)
  const [dataAte, setDataAte] = useState(hoje)
  const [fornecedor, setFornecedor] = useState('')
  const [status, setStatus] = useState('todas')

  // Modais
  const [showNovaCompra, setShowNovaCompra] = useState(false)
  const [showDetalhe, setShowDetalhe] = useState<Compra | null>(null)

  // Nova compra
  const [novoFornecedor, setNovoFornecedor] = useState('')
  const [novoObs, setNovoObs] = useState('')
  const [itensCompra, setItensCompra] = useState<ItemCompra[]>([])
  const [buscaProduto, setBuscaProduto] = useState('')

  const carregarCompras = useCallback(async () => {
    try {
      const res = await api.get('/compras')
      if (res.success && res.data) {
        setCompras(res.data)
      }
    } catch {
      // silencioso
    } finally {
      setLoadingCompras(false)
    }
  }, [])

  useEffect(() => {
    carregarCompras()
  }, [carregarCompras])

  const handleLimpar = useCallback(() => {
    setDataDe(mesInicio)
    setDataAte(hoje)
    setFornecedor('')
    setStatus('todas')
  }, [mesInicio, hoje])

  const filtradas = useMemo(() => {
    return compras.filter(c => {
      const d = c.criadoEm.substring(0, 10)
      if (d < dataDe || d > dataAte) return false
      if (fornecedor && !c.fornecedor.toLowerCase().includes(fornecedor.toLowerCase())) return false
      if (status !== 'todas' && c.status !== status) return false
      return true
    }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
  }, [compras, dataDe, dataAte, fornecedor, status])

  const totalPeriodo = filtradas.reduce((s, c) => s + c.total, 0)

  const produtosFiltrados = useMemo(() => {
    if (!buscaProduto.trim()) return []
    const q = buscaProduto.toLowerCase()
    return produtos.filter(p =>
      p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
    ).slice(0, 5)
  }, [buscaProduto, produtos])

  const addItemCompra = useCallback((p: Produto) => {
    setItensCompra(prev => {
      const existing = prev.find(i => i.produtoId === p._id)
      if (existing) {
        return prev.map(i => i.produtoId === p._id
          ? { ...i, quantidade: i.quantidade + 1, total: (i.quantidade + 1) * i.custoUnitario }
          : i
        )
      }
      return [...prev, {
        produtoId: p._id,
        nome: p.nome,
        quantidade: 1,
        custoUnitario: p.precoCusto || p.preco * 0.6,
        total: p.precoCusto || p.preco * 0.6,
      }]
    })
    setBuscaProduto('')
  }, [])

  const updateItemQtd = useCallback((produtoId: string, qtd: number) => {
    if (qtd <= 0) {
      setItensCompra(prev => prev.filter(i => i.produtoId !== produtoId))
      return
    }
    setItensCompra(prev => prev.map(i =>
      i.produtoId === produtoId ? { ...i, quantidade: qtd, total: qtd * i.custoUnitario } : i
    ))
  }, [])

  const totalNovaCompra = itensCompra.reduce((s, i) => s + i.total, 0)

  const handleCriarCompra = useCallback(async () => {
    if (!novoFornecedor.trim()) { erro('Informe o fornecedor'); return }
    if (itensCompra.length === 0) { erro('Adicione pelo menos um item'); return }

    try {
      const res = await api.post('/compras', {
        fornecedor: novoFornecedor.trim(),
        itens: itensCompra,
        total: totalNovaCompra,
        status: 'pendente',
        observacoes: novoObs.trim() || undefined,
      })

      if (res.success && res.data) {
        await carregarCompras()
        setShowNovaCompra(false)
        setNovoFornecedor('')
        setNovoObs('')
        setItensCompra([])
        sucesso(`Compra #${res.data.numero} criada!`)
      }
    } catch (err: any) {
      erro(err.message || 'Erro ao criar compra')
    }
  }, [novoFornecedor, itensCompra, totalNovaCompra, novoObs, carregarCompras, sucesso, erro])

  const handleReceber = useCallback(async (compra: Compra) => {
    try {
      await api.put(`/compras/${compra._id}/receber`)
      await Promise.all([carregarCompras(), recarregarProdutos()])
      setShowDetalhe(null)
      sucesso(`Compra #${compra.numero} recebida! Estoque atualizado.`)
    } catch (err: any) {
      erro(err.message || 'Erro ao receber compra')
    }
  }, [carregarCompras, recarregarProdutos, sucesso, erro])

  const handleCancelar = useCallback(async (compra: Compra) => {
    try {
      await api.put(`/compras/${compra._id}`, { status: 'cancelada' })
      await carregarCompras()
      setShowDetalhe(null)
      sucesso(`Compra #${compra.numero} cancelada`)
    } catch (err: any) {
      erro(err.message || 'Erro ao cancelar compra')
    }
  }, [carregarCompras, sucesso, erro])

  const statusBadge = (s: string) => {
    if (s === 'recebida') return 'badge-green'
    if (s === 'cancelada') return 'badge-red'
    return 'badge-yellow'
  }

  if (loadingCompras) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Compras</h1>
          <button type="button" onClick={() => setShowNovaCompra(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Nova Compra
          </button>
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="bg-primary px-4 py-3 text-white font-semibold rounded-t-xl -mx-4 -mt-4 mb-4">Filtros</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Data de</label>
              <input type="date" value={dataDe} onChange={(e) => setDataDe(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Data até</label>
              <input type="date" value={dataAte} onChange={(e) => setDataAte(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Fornecedor</label>
              <input type="text" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Nome do fornecedor" className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
                <option value="todas">Todas</option>
                <option value="pendente">Pendente</option>
                <option value="recebida">Recebida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <button type="button" onClick={handleLimpar} className="btn-secondary"><X className="h-4 w-4" /> Limpar</button>
              <button type="button" onClick={() => window.print()} className="btn-secondary"><Printer className="h-4 w-4" /> Imprimir</button>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-gradient-to-r from-primary/10 to-gray-50 px-4 py-4">
          <p className="font-semibold text-text-primary">Resumo do período</p>
          <div className="ml-auto flex flex-wrap gap-6 text-sm">
            <span>Total: <strong className="text-primary">{formatCurrency(totalPeriodo)}</strong></span>
            <span>Quantidade: <strong>{filtradas.length}</strong></span>
          </div>
        </div>

        {/* Lista */}
        <div className="card min-h-[200px]">
          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-text-muted" />
              <p className="mt-3 text-text-secondary">Nenhuma compra encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtradas.map(c => (
                <div key={c._id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">#{c.numero}</span>
                      <span className={statusBadge(c.status)}>{c.status}</span>
                    </div>
                    <p className="text-sm text-text-secondary">{c.fornecedor} - {c.itens.length} ite{c.itens.length === 1 ? 'm' : 'ns'}</p>
                    <p className="text-xs text-text-muted">{formatDateTime(c.criadoEm)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-text-primary">{formatCurrency(c.total)}</span>
                    <button type="button" onClick={() => setShowDetalhe(c)} className="rounded p-1.5 text-primary hover:bg-primary/10">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
            <span className="text-sm text-text-secondary">{filtradas.length} registro{filtradas.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Modal Nova Compra */}
      {showNovaCompra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-text-primary">Nova Compra</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Fornecedor *</label>
                <input type="text" value={novoFornecedor} onChange={e => setNovoFornecedor(e.target.value)} className="input-field" placeholder="Nome do fornecedor" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Adicionar produtos</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input type="text" value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} className="input-field pl-9" placeholder="Buscar produto por nome ou código" />
                </div>
                {produtosFiltrados.length > 0 && (
                  <ul className="mt-1 rounded-lg border border-gray-200 bg-white shadow-lg max-h-40 overflow-y-auto">
                    {produtosFiltrados.map(p => (
                      <li key={p._id}>
                        <button type="button" onClick={() => addItemCompra(p)} className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50">
                          <span>{p.nome} <span className="text-text-muted">({p.codigo})</span></span>
                          <span className="text-text-secondary">{formatCurrency(p.precoCusto || p.preco * 0.6)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {itensCompra.length > 0 && (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-text-secondary">
                      <tr>
                        <th className="px-3 py-2 text-left">Produto</th>
                        <th className="px-3 py-2 text-center w-20">Qtd</th>
                        <th className="px-3 py-2 text-right">Custo</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {itensCompra.map(i => (
                        <tr key={i.produtoId}>
                          <td className="px-3 py-2 text-text-primary">{i.nome}</td>
                          <td className="px-3 py-2 text-center">
                            <input type="number" min="1" value={i.quantidade} onChange={e => updateItemQtd(i.produtoId, parseInt(e.target.value) || 0)} className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm" />
                          </td>
                          <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(i.custoUnitario)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(i.total)}</td>
                          <td className="px-2">
                            <button type="button" onClick={() => updateItemQtd(i.produtoId, 0)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50">
                        <td colSpan={3} className="px-3 py-2 text-right font-semibold">Total:</td>
                        <td className="px-3 py-2 text-right font-bold text-primary">{formatCurrency(totalNovaCompra)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Observações</label>
                <textarea value={novoObs} onChange={e => setNovoObs(e.target.value)} rows={2} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button type="button" onClick={() => { setShowNovaCompra(false); setItensCompra([]); setNovoFornecedor(''); setNovoObs('') }} className="btn-secondary">Cancelar</button>
              <button type="button" onClick={handleCriarCompra} className="btn-primary"><Plus className="h-4 w-4" /> Criar Compra</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhe */}
      {showDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Compra #{showDetalhe.numero}</h2>
                <p className="text-sm text-text-secondary">{showDetalhe.fornecedor}</p>
              </div>
              <span className={statusBadge(showDetalhe.status)}>{showDetalhe.status}</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-text-secondary">
                <p>Criada em: {formatDateTime(showDetalhe.criadoEm)}</p>
                {showDetalhe.recebidaEm && <p>Recebida em: {formatDateTime(showDetalhe.recebidaEm)}</p>}
              </div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-text-secondary">
                    <tr>
                      <th className="px-3 py-2 text-left">Produto</th>
                      <th className="px-3 py-2 text-center">Qtd</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {showDetalhe.itens.map((i, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{i.nome}</td>
                        <td className="px-3 py-2 text-center">{i.quantidade}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(i.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-gray-50">
                      <td colSpan={2} className="px-3 py-2 text-right font-semibold">Total:</td>
                      <td className="px-3 py-2 text-right font-bold text-primary">{formatCurrency(showDetalhe.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {showDetalhe.observacoes && (
                <p className="text-sm text-text-secondary"><strong>Obs:</strong> {showDetalhe.observacoes}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button type="button" onClick={() => setShowDetalhe(null)} className="btn-secondary">Fechar</button>
              {showDetalhe.status === 'pendente' && (
                <>
                  <button type="button" onClick={() => handleCancelar(showDetalhe)} className="btn-danger">Cancelar</button>
                  <button type="button" onClick={() => handleReceber(showDetalhe)} className="btn-primary">
                    <PackageCheck className="h-4 w-4" /> Receber
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
