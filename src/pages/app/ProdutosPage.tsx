import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, Plus, Package, Edit, Trash2, Box, AlertTriangle } from 'lucide-react'
import { useProdutos } from '../../contexts/ProdutoContext'
import { formatCurrency } from '../../utils/helpers'
import { TutorialModal } from '../../components/app/TutorialModal'
import { tutorialProdutos } from '../../config/tutorials'

export function ProdutosPage() {
  const navigate = useNavigate()
  const { produtos, removerProduto } = useProdutos()

  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'produto' | 'servico'>('todos')
  const [filtroStatus, setFiltroStatus] = useState<'ativos' | 'inativos' | 'todos'>('ativos')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return produtos.filter(p => {
      if (filtroTipo !== 'todos' && p.tipo !== filtroTipo) return false
      if (filtroStatus === 'ativos' && !p.ativo) return false
      if (filtroStatus === 'inativos' && p.ativo) return false
      if (busca) {
        const t = busca.toLowerCase()
        return p.nome.toLowerCase().includes(t) || p.codigo.includes(t) || (p.codigoBarras || '').includes(t)
      }
      return true
    })
  }, [produtos, busca, filtroTipo, filtroStatus])

  const handleDelete = (id: string) => {
    removerProduto(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Produtos e Servicos</h1>
            <p className="text-sm text-gray-500">{filtered.length} registro(s)</p>
          </div>
          <Link to="/app/produtos/novo" className="btn-primary">
            <Plus size={18} /> Novo Produto
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Nome, codigo ou codigo de barras"
                  className="input-field pl-9"
                />
              </div>
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as typeof filtroTipo)} className="input-field">
                <option value="todos">Todos</option>
                <option value="produto">Produtos</option>
                <option value="servico">Servicos</option>
              </select>
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)} className="input-field">
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product list */}
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16">
            <Box size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhum produto encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros ou cadastre um novo produto</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <div key={p._id} className="card p-4 flex items-center gap-4 hover:border-primary/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/app/produtos/${p._id}`)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  p.tipo === 'servico' ? 'bg-purple-100' : 'bg-primary/10'
                }`}>
                  <Package size={20} className={p.tipo === 'servico' ? 'text-purple-600' : 'text-primary'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">{p.nome}</p>
                    {!p.ativo && <span className="badge badge-gray">Inativo</span>}
                    {p.tipo === 'produto' && p.estoque <= p.estoqueMinimo && (
                      <span className="badge badge-warning flex items-center gap-1">
                        <AlertTriangle size={10} /> Estoque baixo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Cod: {p.codigo} {p.codigoBarras && `| CB: ${p.codigoBarras}`} | {p.tipo === 'produto' ? `Estoque: ${p.estoque} ${p.unidade}` : 'Servico'}
                    {p.grupo && ` | ${p.grupo}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-primary">{formatCurrency(p.preco)}</p>
                  {p.precoCusto && <p className="text-xs text-gray-400">Custo: {formatCurrency(p.precoCusto)}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => navigate(`/app/produtos/${p._id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => setConfirmDelete(p._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar exclusao</h3>
            <p className="text-sm text-gray-600 mb-6">Tem certeza que deseja remover este produto? Esta acao nao pode ser desfeita.</p>
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
