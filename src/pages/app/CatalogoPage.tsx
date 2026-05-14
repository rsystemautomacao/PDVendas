import { Package, Search, Printer, Share2, Filter, Check, CheckSquare, Square, Tag } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../utils/helpers'

export function CatalogoPage() {
  const { produtos } = useProdutos()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [apenasAtivos, setApenasAtivos] = useState(true)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [showFiltros, setShowFiltros] = useState(false)

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

  const filtrados = useMemo(() => {
    return produtos.filter(p => {
      if (apenasAtivos && !p.ativo) return false
      if (grupo && p.grupo !== grupo) return false
      if (categoria && p.categoria !== categoria) return false
      if (busca) {
        const q = busca.toLowerCase()
        if (!p.nome.toLowerCase().includes(q) && !p.codigo.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [produtos, busca, grupo, categoria, apenasAtivos])

  const totalEstoque = filtrados.reduce((s, p) => s + p.estoque, 0)
  const valorTotal = filtrados.reduce((s, p) => s + p.preco * p.estoque, 0)

  const toggleProduto = (id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleTodos = () => {
    const ids = filtrados.map(p => p._id)
    const todosJa = ids.every(id => selecionados.has(id))
    if (todosJa) setSelecionados(new Set())
    else setSelecionados(new Set(ids))
  }

  const temFiltroAtivo = grupo || categoria || busca

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Catalogo</h1>
            <p className="mt-1 text-sm text-text-secondary">Visualize seu catalogo de produtos e servicos.</p>
          </div>
          <div className="flex gap-2 print:hidden flex-wrap">
            <button
              onClick={() => navigate('/app/promocoes')}
              className="btn-secondary"
            >
              <Tag className="h-4 w-4" /> Promocoes
            </button>
            <button
              type="button"
              onClick={() => {
                const adminId = user?.adminId || user?._id
                const url = `${window.location.origin}/vitrine/${adminId}`
                navigator.clipboard.writeText(url)
                toast.sucesso('Link do catalogo copiado!')
              }}
              className="btn-secondary"
            >
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
            <button type="button" onClick={() => window.print()} className="btn-secondary">
              <Printer className="h-4 w-4" /> Imprimir
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou codigo"
                className="input-field pl-9"
              />
            </div>
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`btn-secondary ${showFiltros || temFiltroAtivo ? '!border-primary !text-primary' : ''}`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {temFiltroAtivo && <span className="ml-1 h-2 w-2 rounded-full bg-primary inline-block" />}
            </button>
          </div>

          {showFiltros && (
            <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in">
              <select value={grupo} onChange={e => setGrupo(e.target.value)} className="input-field w-auto min-w-[160px]">
                <option value="">Todos os grupos</option>
                {grupos.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="input-field w-auto min-w-[160px]">
                <option value="">Todas as categorias</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <input type="checkbox" checked={apenasAtivos} onChange={e => setApenasAtivos(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                Apenas ativos
              </label>
              {temFiltroAtivo && (
                <button
                  onClick={() => { setGrupo(''); setCategoria(''); setBusca('') }}
                  className="text-xs text-primary font-semibold hover:underline ml-auto"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Resumo + Selecao */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm">
            <span className="text-text-secondary">Produtos: </span>
            <strong className="text-primary">{filtrados.length}</strong>
          </div>
          <div className="rounded-lg bg-green-50 px-4 py-2 text-sm">
            <span className="text-text-secondary">Estoque total: </span>
            <strong className="text-green-700">{totalEstoque} un.</strong>
          </div>
          <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm">
            <span className="text-text-secondary">Valor em estoque: </span>
            <strong className="text-blue-700">{formatCurrency(valorTotal)}</strong>
          </div>
          <div className="ml-auto flex items-center gap-2 print:hidden">
            {selecionados.size > 0 && (
              <span className="text-xs text-primary font-semibold">{selecionados.size} selecionado(s)</span>
            )}
            <button
              onClick={toggleTodos}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-text-secondary"
            >
              {filtrados.length > 0 && filtrados.every(p => selecionados.has(p._id)) ? (
                <><CheckSquare className="h-3.5 w-3.5 text-primary" /> Desmarcar todos</>
              ) : (
                <><Square className="h-3.5 w-3.5" /> Selecionar todos</>
              )}
            </button>
          </div>
        </div>

        {/* Grid de Produtos */}
        {filtrados.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
            <Package className="h-16 w-16 text-text-muted" />
            <p className="mt-4 font-medium text-text-primary">Nenhum produto encontrado</p>
            <p className="text-sm text-text-secondary">Ajuste os filtros ou cadastre produtos.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtrados.map(p => {
              const selected = selecionados.has(p._id)
              return (
                <div
                  key={p._id}
                  onClick={() => toggleProduto(p._id)}
                  className={`rounded-xl border bg-white p-4 shadow-card cursor-pointer transition-all ${
                    selected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    {p.fotos && p.fotos.length > 0 ? (
                      <img src={p.fotos[0]} alt={p.nome} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${p.ativo ? 'text-green-600' : 'text-text-muted'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      <div className={`h-5 w-5 rounded flex items-center justify-center transition-colors print:hidden ${
                        selected ? 'bg-primary text-white' : 'border border-gray-300'
                      }`}>
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold text-text-primary line-clamp-1">{p.nome}</h3>
                  <p className="text-xs text-text-muted">{p.codigo}{p.grupo ? ` - ${p.grupo}` : ''}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(p.preco)}</p>
                      {p.precoCusto != null && p.precoCusto > 0 && (
                        <p className="text-xs text-text-muted">Custo: {formatCurrency(p.precoCusto)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${p.estoque <= p.estoqueMinimo ? 'text-red-600' : 'text-text-primary'}`}>
                        {p.estoque} {p.unidade}
                      </p>
                      {p.estoque <= p.estoqueMinimo && (
                        <p className="text-xs text-red-500">Estoque baixo</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
