import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Package, ShoppingBag, Phone } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface ProdutoCatalogo {
  _id: string
  nome: string
  codigo: string
  preco: number
  precoAtacado?: number
  qtdMinimaAtacado?: number
  grupo?: string
  marca?: string
  estoque: number
  unidade: string
  categoria?: string
}

interface EmpresaInfo {
  nome: string
  telefone: string
  logoBase64: string
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function VitrinePublicaPage() {
  const { empresaId } = useParams<{ empresaId: string }>()
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([])
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState('')

  useEffect(() => {
    if (!empresaId) return
    fetch(`${API_BASE}/catalogo/${empresaId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProdutos(data.data || [])
          setEmpresa(data.empresa || null)
        } else {
          setErro(data.error || 'Catalogo nao encontrado')
        }
      })
      .catch(() => setErro('Erro ao carregar catalogo'))
      .finally(() => setLoading(false))
  }, [empresaId])

  const grupos = useMemo(() => {
    const set = new Set<string>()
    produtos.forEach(p => { if (p.grupo) set.add(p.grupo) })
    return Array.from(set).sort()
  }, [produtos])

  const filtrados = useMemo(() => {
    return produtos.filter(p => {
      if (grupo && p.grupo !== grupo) return false
      if (busca) {
        const q = busca.toLowerCase()
        return p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      }
      return true
    })
  }, [produtos, busca, grupo])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <ShoppingBag size={64} className="text-gray-300 mb-4" />
        <p className="text-xl font-bold text-gray-700 mb-2">Catalogo indisponivel</p>
        <p className="text-gray-500">{erro}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          {empresa?.logoBase64 ? (
            <img src={empresa.logoBase64} alt="Logo" className="h-10 w-10 rounded-xl object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <ShoppingBag size={20} className="text-white" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">{empresa?.nome || 'Catalogo'}</h1>
            <p className="text-xs text-gray-500">{produtos.length} produto(s) disponiveis</p>
          </div>
          {empresa?.telefone && (
            <a
              href={`https://wa.me/55${empresa.telefone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl text-sm font-semibold hover:bg-[#1da851] transition-colors"
            >
              <Phone size={16} /> Contato
            </a>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text" placeholder="Buscar produto..."
              value={busca} onChange={e => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          {grupos.length > 0 && (
            <select
              value={grupo} onChange={e => setGrupo(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Todas as categorias</option>
              {grupos.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
        </div>

        {/* Products grid */}
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package size={64} className="text-gray-200 mb-4" />
            <p className="text-gray-400 text-lg">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtrados.map(p => (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-32 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                  <Package size={40} className="text-indigo-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 min-h-[2.5rem]">{p.nome}</h3>
                  {p.grupo && <p className="text-xs text-gray-400 mt-0.5">{p.grupo}</p>}
                  <div className="mt-3">
                    <p className="text-lg font-bold text-indigo-600">{formatCurrency(p.preco)}</p>
                    {p.precoAtacado && p.qtdMinimaAtacado && (
                      <p className="text-xs text-green-600 font-medium">
                        Atacado: {formatCurrency(p.precoAtacado)} ({p.qtdMinimaAtacado}+ un)
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.estoque > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {p.estoque > 0 ? 'Disponivel' : 'Esgotado'}
                    </span>
                    {empresa?.telefone && p.estoque > 0 && (
                      <a
                        href={`https://wa.me/55${empresa.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Ola! Tenho interesse no produto: ${p.nome} - ${formatCurrency(p.preco)}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#25D366] font-semibold hover:underline"
                      >
                        Comprar
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t bg-white text-center">
        <p className="text-xs text-gray-400">Catalogo digital powered by MeuPDV</p>
      </footer>
    </div>
  )
}
