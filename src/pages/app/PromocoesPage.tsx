import { useState, useEffect, useMemo, useCallback } from 'react'
import { Tag, Plus, Trash2, Edit3, Search, Package, Check, X, Percent, Calendar, ToggleLeft, ToggleRight, Filter } from 'lucide-react'
import { api } from '../../services/api'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../utils/helpers'

interface Promocao {
  _id: string
  nome: string
  descricao?: string
  percentual: number
  produtos: { _id: string; nome: string; codigo: string; preco: number; grupo?: string; categoria?: string }[]
  grupo?: string
  categoria?: string
  ativo: boolean
  dataInicio: string
  dataFim?: string
}

export function PromocoesPage() {
  const { produtos } = useProdutos()
  const toast = useToast()
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Promocao | null>(null)
  const [confirmExcluir, setConfirmExcluir] = useState<string | null>(null)

  // Form
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [percentual, setPercentual] = useState(10)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [buscaProduto, setBuscaProduto] = useState('')
  const [modoSelecao, setModoSelecao] = useState<'manual' | 'grupo' | 'categoria'>('manual')
  const [saving, setSaving] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/promocoes')
      setPromocoes(res.data || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const grupos = useMemo(() => {
    const set = new Set<string>()
    produtos.forEach(p => { if (p.grupo) set.add(p.grupo) })
    return Array.from(set).sort()
  }, [produtos])

  const categorias = useMemo(() => {
    const set = new Set<string>()
    produtos.forEach(p => { if (p.categoria) set.add(p.categoria) })
    return Array.from(set).sort()
  }, [produtos])

  const produtosAtivos = useMemo(() => produtos.filter(p => p.ativo), [produtos])

  const produtosFiltrados = useMemo(() => {
    return produtosAtivos.filter(p => {
      if (buscaProduto) {
        const q = buscaProduto.toLowerCase()
        if (!p.nome.toLowerCase().includes(q) && !p.codigo.toLowerCase().includes(q)) return false
      }
      if (modoSelecao === 'grupo' && filtroGrupo && p.grupo !== filtroGrupo) return false
      if (modoSelecao === 'categoria' && filtroCategoria && p.categoria !== filtroCategoria) return false
      return true
    })
  }, [produtosAtivos, buscaProduto, modoSelecao, filtroGrupo, filtroCategoria])

  const abrirModal = (promo?: Promocao) => {
    if (promo) {
      setEditando(promo)
      setNome(promo.nome)
      setDescricao(promo.descricao || '')
      setPercentual(promo.percentual)
      setDataInicio(promo.dataInicio ? promo.dataInicio.slice(0, 10) : '')
      setDataFim(promo.dataFim ? promo.dataFim.slice(0, 10) : '')
      setSelecionados(new Set(promo.produtos.map(p => p._id)))
      if (promo.grupo) { setModoSelecao('grupo'); setFiltroGrupo(promo.grupo) }
      else if (promo.categoria) { setModoSelecao('categoria'); setFiltroCategoria(promo.categoria) }
      else { setModoSelecao('manual') }
    } else {
      setEditando(null)
      setNome('')
      setDescricao('')
      setPercentual(10)
      setDataInicio(new Date().toISOString().slice(0, 10))
      setDataFim('')
      setSelecionados(new Set())
      setModoSelecao('manual')
      setFiltroGrupo('')
      setFiltroCategoria('')
    }
    setBuscaProduto('')
    setShowModal(true)
  }

  const toggleProduto = (id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selecionarTodos = () => {
    const ids = produtosFiltrados.map(p => p._id)
    setSelecionados(prev => {
      const next = new Set(prev)
      const todosJa = ids.every(id => next.has(id))
      if (todosJa) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }

  const salvar = async () => {
    if (!nome.trim()) { toast.erro('Informe o nome da promocao'); return }
    if (percentual < 1 || percentual > 99) { toast.erro('Percentual deve ser entre 1% e 99%'); return }
    if (selecionados.size === 0 && modoSelecao === 'manual') { toast.erro('Selecione ao menos um produto'); return }

    setSaving(true)
    try {
      const body = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        percentual: Number(percentual),
        dataInicio: dataInicio || new Date().toISOString(),
        dataFim: dataFim || undefined,
        produtos: Array.from(selecionados),
        grupo: modoSelecao === 'grupo' ? filtroGrupo : undefined,
        categoria: modoSelecao === 'categoria' ? filtroCategoria : undefined,
      }

      if (editando) {
        await api.put(`/promocoes/${editando._id}`, body)
        toast.sucesso('Promocao atualizada!')
      } else {
        await api.post('/promocoes', body)
        toast.sucesso('Promocao criada!')
      }
      setShowModal(false)
      carregar()
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  const excluir = async (id: string) => {
    setConfirmExcluir(null)
    try {
      await api.delete(`/promocoes/${id}`)
      toast.sucesso('Promocao excluida')
      carregar()
    } catch { toast.erro('Erro ao excluir') }
  }

  const toggleAtivo = async (promo: Promocao) => {
    try {
      await api.put(`/promocoes/${promo._id}`, { ativo: !promo.ativo })
      carregar()
    } catch { toast.erro('Erro ao atualizar') }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Promocoes</h1>
            <p className="mt-1 text-sm text-text-secondary">Crie promocoes com desconto percentual para seus produtos.</p>
          </div>
          <button onClick={() => abrirModal()} className="btn-primary">
            <Plus className="h-4 w-4" /> Nova Promocao
          </button>
        </div>

        {/* Lista */}
        {promocoes.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
            <Tag className="h-16 w-16 text-text-muted" />
            <p className="mt-4 font-medium text-text-primary">Nenhuma promocao cadastrada</p>
            <p className="text-sm text-text-secondary">Crie sua primeira promocao para atrair mais clientes.</p>
            <button onClick={() => abrirModal()} className="btn-primary mt-4">
              <Plus className="h-4 w-4" /> Criar Promocao
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promocoes.map(promo => {
              const vigente = promo.ativo && new Date(promo.dataInicio) <= new Date() && (!promo.dataFim || new Date(promo.dataFim) >= new Date())
              return (
                <div key={promo._id} className={`rounded-xl border bg-white p-5 shadow-card transition-colors ${vigente ? 'border-green-200' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${vigente ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Percent className={`h-5 w-5 ${vigente ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{promo.nome}</h3>
                        <span className={`text-xs font-bold ${vigente ? 'text-green-600' : promo.ativo ? 'text-amber-500' : 'text-gray-400'}`}>
                          {vigente ? 'Ativa' : promo.ativo ? 'Agendada' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-primary">-{promo.percentual}%</span>
                  </div>

                  {promo.descricao && <p className="mt-2 text-xs text-text-secondary line-clamp-2">{promo.descricao}</p>}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {promo.produtos.length} produto(s)
                    </span>
                    {promo.grupo && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        Grupo: {promo.grupo}
                      </span>
                    )}
                    {promo.categoria && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                        Cat: {promo.categoria}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs text-text-muted">
                    <Calendar className="h-3 w-3" />
                    {new Date(promo.dataInicio).toLocaleDateString('pt-BR')}
                    {promo.dataFim && ` - ${new Date(promo.dataFim).toLocaleDateString('pt-BR')}`}
                    {!promo.dataFim && ' - Sem prazo'}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <button onClick={() => toggleAtivo(promo)} className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary">
                      {promo.ativo ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                      {promo.ativo ? 'Ativa' : 'Inativa'}
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => abrirModal(promo)} className="p-2 rounded-lg hover:bg-gray-100 text-text-muted">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmExcluir(promo._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de criacao/edicao */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-text-primary">
                {editando ? 'Editar Promocao' : 'Nova Promocao'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-1">Nome da promocao *</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Liquidacao de Verao" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Desconto (%) *</label>
                  <div className="relative">
                    <input type="number" min={1} max={99} value={percentual} onChange={e => setPercentual(Number(e.target.value))} className="input-field pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Descricao (opcional)</label>
                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Desconto especial para ..." className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Data inicio</label>
                  <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Data fim (opcional)</label>
                  <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Aplicar desconto em:</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'manual' as const, label: 'Selecionar produtos', icon: Check },
                    { value: 'grupo' as const, label: 'Por grupo', icon: Filter },
                    { value: 'categoria' as const, label: 'Por categoria', icon: Tag },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setModoSelecao(opt.value); setSelecionados(new Set()) }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        modoSelecao === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-text-secondary hover:bg-gray-50'
                      }`}
                    >
                      <opt.icon className="h-4 w-4" /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {modoSelecao === 'grupo' && (
                <select value={filtroGrupo} onChange={e => { setFiltroGrupo(e.target.value); setSelecionados(new Set()) }} className="input-field">
                  <option value="">Selecione um grupo</option>
                  {grupos.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              )}
              {modoSelecao === 'categoria' && (
                <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setSelecionados(new Set()) }} className="input-field">
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-primary">
                    Produtos ({selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''})
                  </label>
                  <button onClick={selecionarTodos} className="text-xs font-semibold text-primary hover:underline">
                    {produtosFiltrados.every(p => selecionados.has(p._id)) && produtosFiltrados.length > 0 ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-4 w-4" />
                  <input type="text" value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} placeholder="Buscar produto..." className="input-field pl-9" />
                </div>
                <div className="border border-gray-200 rounded-xl max-h-[240px] overflow-y-auto">
                  {produtosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-text-muted">
                      <Package className="h-8 w-8 mb-2" />
                      <p className="text-sm">Nenhum produto encontrado</p>
                    </div>
                  ) : (
                    produtosFiltrados.map(p => {
                      const checked = selecionados.has(p._id)
                      const precoDesc = p.preco * (1 - percentual / 100)
                      return (
                        <label
                          key={p._id}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${checked ? 'bg-primary/5' : ''}`}
                        >
                          <input type="checkbox" checked={checked} onChange={() => toggleProduto(p._id)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{p.nome}</p>
                            <p className="text-xs text-text-muted">{p.codigo}{p.grupo ? ` - ${p.grupo}` : ''}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {checked ? (
                              <>
                                <p className="text-xs text-red-400 line-through">{formatCurrency(p.preco)}</p>
                                <p className="text-sm font-bold text-green-600">{formatCurrency(precoDesc)}</p>
                              </>
                            ) : (
                              <p className="text-sm font-medium text-text-primary">{formatCurrency(p.preco)}</p>
                            )}
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={salvar} disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : editando ? 'Salvar Alteracoes' : 'Criar Promocao'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmacao de exclusao (substitui confirm() do navegador) */}
      {confirmExcluir && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Excluir promocao?</h3>
            <p className="text-sm text-text-secondary mb-6">Esta acao nao pode ser desfeita. A promocao sera removida permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmExcluir(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 text-sm">
                Cancelar
              </button>
              <button onClick={() => excluir(confirmExcluir)} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 text-sm">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
