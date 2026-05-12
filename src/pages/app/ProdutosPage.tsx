import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Package, Edit, Trash2, Box,
  LayoutGrid, AlertTriangle, TrendingUp, DollarSign,
  Tag, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useProdutos } from '../../contexts/ProdutoContext'
import { formatCurrency } from '../../utils/helpers'
import { TutorialModal } from '../../components/app/TutorialModal'
import { tutorialProdutos } from '../../config/tutorials'
import type { Produto } from '../../types'

const POR_PAGINA = 10

type FiltroEstoque = 'todos' | 'baixo' | 'medio' | 'alto'
type Ordenacao = 'nome_asc' | 'nome_desc' | 'preco_asc' | 'preco_desc' | 'estoque_asc' | 'estoque_desc'

function nivelEstoque(p: Produto): 'baixo' | 'medio' | 'alto' | 'servico' {
  if (p.tipo !== 'produto') return 'servico'
  if (p.estoque <= p.estoqueMinimo) return 'baixo'
  if (p.estoque <= p.estoqueMinimo * 3) return 'medio'
  return 'alto'
}

function badgeEstoque(p: Produto) {
  if (p.tipo !== 'produto') return null
  const nivel = nivelEstoque(p)
  const cores: Record<string, string> = {
    baixo: 'bg-red-100 text-red-700',
    medio: 'bg-yellow-100 text-yellow-700',
    alto: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cores[nivel]}`}>
      {p.estoque} {p.unidade}
    </span>
  )
}

export function ProdutosPage() {
  const navigate = useNavigate()
  const { produtos, removerProduto } = useProdutos()

  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todos')
  const [filtroEstoque, setFiltroEstoque] = useState<FiltroEstoque>('todos')
  const [filtroStatus, setFiltroStatus] = useState<'ativos' | 'todos'>('ativos')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('nome_asc')
  const [pagina, setPagina] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // ---- Estatísticas dos cards ----
  const produtosAtivos = useMemo(() => produtos.filter(p => p.ativo && p.tipo === 'produto'), [produtos])
  const totalProdutos = produtosAtivos.length
  const totalBaixoEstoque = useMemo(() => produtosAtivos.filter(p => nivelEstoque(p) === 'baixo').length, [produtosAtivos])
  const categorias = useMemo(() => {
    const set = new Set<string>()
    produtos.forEach(p => { if (p.grupo) set.add(p.grupo) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [produtos])
  const valorTotalEstoque = useMemo(
    () => produtosAtivos.reduce((s, p) => s + p.preco * (p.estoque || 0), 0),
    [produtosAtivos],
  )

  // ---- Filtros + ordenação ----
  const filtered = useMemo(() => {
    let list = produtos.filter(p => {
      if (filtroStatus === 'ativos' && !p.ativo) return false
      if (filtroCategoria !== 'todos' && (p.grupo || '') !== filtroCategoria) return false
      if (filtroEstoque !== 'todos') {
        if (p.tipo !== 'produto') return false
        const nivel = nivelEstoque(p)
        if (nivel !== filtroEstoque) return false
      }
      if (busca) {
        const t = busca.toLowerCase()
        return (
          p.nome.toLowerCase().includes(t) ||
          p.codigo.includes(t) ||
          (p.codigoBarras || '').includes(t)
        )
      }
      return true
    })

    list = [...list].sort((a, b) => {
      switch (ordenacao) {
        case 'nome_asc': return a.nome.localeCompare(b.nome, 'pt-BR')
        case 'nome_desc': return b.nome.localeCompare(a.nome, 'pt-BR')
        case 'preco_asc': return a.preco - b.preco
        case 'preco_desc': return b.preco - a.preco
        case 'estoque_asc': return (a.estoque || 0) - (b.estoque || 0)
        case 'estoque_desc': return (b.estoque || 0) - (a.estoque || 0)
        default: return 0
      }
    })
    return list
  }, [produtos, busca, filtroCategoria, filtroEstoque, filtroStatus, ordenacao])

  // ---- Paginação ----
  const totalPaginas = Math.max(1, Math.ceil(filtered.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * POR_PAGINA
  const paginated = filtered.slice(inicio, inicio + POR_PAGINA)

  const limparFiltros = () => {
    setBusca('')
    setFiltroCategoria('todos')
    setFiltroEstoque('todos')
    setFiltroStatus('ativos')
    setOrdenacao('nome_asc')
    setPagina(1)
  }

  const handleDelete = (id: string) => {
    removerProduto(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* ---- Cards informativos ---- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total de Produtos',
              value: totalProdutos,
              icon: <LayoutGrid size={22} className="text-white/80" />,
              color: 'from-blue-500 to-blue-700',
            },
            {
              label: 'Baixo Estoque',
              value: totalBaixoEstoque,
              icon: <AlertTriangle size={22} className="text-white/80" />,
              color: totalBaixoEstoque > 0 ? 'from-red-500 to-red-700' : 'from-blue-500 to-blue-700',
            },
            {
              label: 'Categorias Ativas',
              value: categorias.length,
              icon: <Tag size={22} className="text-white/80" />,
              color: 'from-indigo-500 to-indigo-700',
            },
            {
              label: 'Valor Total em Estoque',
              value: formatCurrency(valorTotalEstoque),
              icon: <DollarSign size={22} className="text-white/80" />,
              color: 'from-violet-500 to-violet-700',
              large: true,
            },
          ].map(card => (
            <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{card.label}</span>
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">{card.icon}</div>
              </div>
              <p className={`font-bold leading-none ${card.large ? 'text-xl' : 'text-3xl'}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* ---- Layout: sidebar + tabela ---- */}
        <div className="flex gap-5 items-start">

          {/* ---- Painel de filtros ---- */}
          <aside className="hidden md:block w-60 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5 sticky top-20">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
              <Search size={15} /> Filtros
            </h2>

            {/* Busca */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Buscar Produto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  value={busca}
                  onChange={e => { setBusca(e.target.value); setPagina(1) }}
                  placeholder="Nome, código ou barras..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Categorias */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categorias</label>
              <button
                onClick={() => { setFiltroCategoria('todos'); setPagina(1) }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filtroCategoria === 'todos' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <LayoutGrid size={14} /> Todas as Categorias
              </button>
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setFiltroCategoria(cat); setPagina(1) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${filtroCategoria === cat ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Tag size={13} /> {cat}
                </button>
              ))}
              {categorias.length === 0 && (
                <p className="text-xs text-gray-400 italic">Nenhuma categoria cadastrada</p>
              )}
            </div>

            {/* Status do Estoque */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status do Estoque</label>
              {[
                { key: 'todos', label: 'Todos', icon: <Box size={13} />, cls: 'text-gray-600' },
                { key: 'baixo', label: 'Baixo Estoque', icon: <AlertTriangle size={13} />, cls: 'text-red-500' },
                { key: 'medio', label: 'Médio', icon: <TrendingUp size={13} />, cls: 'text-yellow-500' },
                { key: 'alto', label: 'Alto', icon: <TrendingUp size={13} />, cls: 'text-green-500' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setFiltroEstoque(opt.key as FiltroEstoque); setPagina(1) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${filtroEstoque === opt.key
                      ? 'bg-gray-100 font-semibold'
                      : 'hover:bg-gray-50'
                    } ${opt.cls}`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            {/* Ordenar por */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordenar por</label>
              <select
                value={ordenacao}
                onChange={e => { setOrdenacao(e.target.value as Ordenacao); setPagina(1) }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              >
                <option value="nome_asc">Nome (A-Z)</option>
                <option value="nome_desc">Nome (Z-A)</option>
                <option value="preco_asc">Preço (Menor)</option>
                <option value="preco_desc">Preço (Maior)</option>
                <option value="estoque_asc">Estoque (Menor)</option>
                <option value="estoque_desc">Estoque (Maior)</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Visibilidade</label>
              <select
                value={filtroStatus}
                onChange={e => { setFiltroStatus(e.target.value as 'ativos' | 'todos'); setPagina(1) }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              >
                <option value="ativos">Somente Ativos</option>
                <option value="todos">Todos (incl. inativos)</option>
              </select>
            </div>

            {/* Limpar */}
            <button
              onClick={limparFiltros}
              className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 font-medium py-2 transition-colors"
            >
              <RefreshCw size={13} /> Limpar Filtros
            </button>
          </aside>

          {/* ---- Tabela de produtos ---- */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Cabeçalho da tabela */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Package size={18} className="text-primary" /> Produtos
                </h1>
                <p className="text-xs text-gray-500">
                  {filtered.length === produtos.length
                    ? 'Mostrando todos os produtos'
                    : `${filtered.length} resultado(s) encontrado(s)`}
                </p>
              </div>
              <button onClick={() => navigate('/app/produtos/novo')} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                <Plus size={16} /> Novo Produto
              </button>
            </div>

            {/* Filtros mobile (linha) */}
            <div className="flex md:hidden gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  value={busca}
                  onChange={e => { setBusca(e.target.value); setPagina(1) }}
                  placeholder="Buscar produto..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <select
                value={ordenacao}
                onChange={e => setOrdenacao(e.target.value as Ordenacao)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none"
              >
                <option value="nome_asc">A-Z</option>
                <option value="nome_desc">Z-A</option>
                <option value="preco_desc">Maior preço</option>
                <option value="preco_asc">Menor preço</option>
              </select>
            </div>

            {/* Tabela */}
            {paginated.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16">
                <Box size={48} className="text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Nenhum produto encontrado</p>
                <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros ou cadastre um novo produto</p>
                <button onClick={limparFiltros} className="mt-4 text-sm text-primary hover:underline flex items-center gap-1">
                  <RefreshCw size={13} /> Limpar filtros
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Código</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produto</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Preço</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Estoque</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32 hidden lg:table-cell">Categoria</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map(p => (
                      <tr
                        key={p._id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/app/produtos/${p._id}`)}
                      >
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.codigo}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              p.tipo === 'servico' ? 'bg-purple-100' : 'bg-primary/10'
                            }`}>
                              <Package size={15} className={p.tipo === 'servico' ? 'text-purple-600' : 'text-primary'} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 leading-tight">{p.nome}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {p.codigoBarras || p.codigo}
                                {!p.ativo && <span className="ml-2 text-red-400 font-medium">• Inativo</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(p.preco)}</td>
                        <td className="px-4 py-3 text-center">
                          {p.tipo === 'produto' ? badgeEstoque(p) : (
                            <span className="text-xs text-gray-400 italic">Serviço</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          {p.grupo ? (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">{p.grupo}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/app/produtos/${p._id}`)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors"
                              title="Editar"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(p._id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">
                      Mostrando <span className="font-semibold">{inicio + 1}</span> a{' '}
                      <span className="font-semibold">{Math.min(inicio + POR_PAGINA, filtered.length)}</span> de{' '}
                      <span className="font-semibold">{filtered.length}</span> produtos
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPagina(p => Math.max(1, p - 1))}
                        disabled={paginaAtual === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-medium text-gray-600 px-2">
                        Página {paginaAtual} de {totalPaginas}
                      </span>
                      <button
                        onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                        disabled={paginaAtual === totalPaginas}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Resumo sem paginação */}
                {totalPaginas === 1 && filtered.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">
                      Mostrando <span className="font-semibold">{filtered.length}</span> produto(s)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Modal de confirmação de exclusão ---- */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja remover este produto? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="btn-danger flex-1">Remover</button>
            </div>
          </div>
        </div>
      )}

      <TutorialModal id="produtos" titulo="Gerenciamento de Produtos" subtitulo="Cadastre e controle seu estoque" steps={tutorialProdutos} />
    </div>
  )
}
