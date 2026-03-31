import { Package, Search, Printer } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useProdutos } from '../../contexts/ProdutoContext'
import { formatCurrency } from '../../utils/helpers'

export function CatalogoPage() {
  const { produtos } = useProdutos()
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState('')
  const [apenasAtivos, setApenasAtivos] = useState(true)

  const grupos = useMemo(() => {
    const set = new Set<string>()
    produtos.forEach(p => { if (p.grupo) set.add(p.grupo) })
    return Array.from(set).sort()
  }, [produtos])

  const filtrados = useMemo(() => {
    return produtos.filter(p => {
      if (apenasAtivos && !p.ativo) return false
      if (grupo && p.grupo !== grupo) return false
      if (busca) {
        const q = busca.toLowerCase()
        if (!p.nome.toLowerCase().includes(q) && !p.codigo.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [produtos, busca, grupo, apenasAtivos])

  const totalEstoque = filtrados.reduce((s, p) => s + p.estoque, 0)
  const valorTotal = filtrados.reduce((s, p) => s + p.preco * p.estoque, 0)

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Catálogo</h1>
            <p className="mt-1 text-sm text-text-secondary">Visualize seu catálogo de produtos e serviços.</p>
          </div>
          <button type="button" onClick={() => window.print()} className="btn-secondary print:hidden">
            <Printer className="h-4 w-4" /> Imprimir
          </button>
        </div>

        {/* Filtros */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou código"
              className="input-field pl-9"
            />
          </div>
          <select value={grupo} onChange={e => setGrupo(e.target.value)} className="input-field w-auto">
            <option value="">Todos os grupos</option>
            {grupos.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
            <input type="checkbox" checked={apenasAtivos} onChange={e => setApenasAtivos(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
            Apenas ativos
          </label>
        </div>

        {/* Resumo */}
        <div className="mt-4 flex flex-wrap gap-4">
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
            {filtrados.map(p => (
              <div key={p._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-card hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`text-xs font-medium ${p.ativo ? 'text-green-600' : 'text-text-muted'}`}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
