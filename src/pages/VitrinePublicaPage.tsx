import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Package, ShoppingBag, Phone, Tag } from 'lucide-react'

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

interface DescontoInfo {
  percentual: number
  nomePromo: string
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function VitrinePublicaPage() {
  const { empresaId } = useParams<{ empresaId: string }>()
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([])
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null)
  const [promocoes, setPromocoes] = useState<Record<string, DescontoInfo>>({})
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState('')
  const [filtroPromo, setFiltroPromo] = useState(false)

  useEffect(() => {
    if (!empresaId) return
    fetch(`${API_BASE}/catalogo/${empresaId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProdutos(data.data || [])
          setEmpresa(data.empresa || null)
          setPromocoes(data.promocoes || {})
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

  const temPromocoes = Object.keys(promocoes).length > 0

  const filtrados = useMemo(() => {
    return produtos.filter(p => {
      if (grupo && p.grupo !== grupo) return false
      if (filtroPromo && !promocoes[p._id]) return false
      if (busca) {
        const q = busca.toLowerCase()
        return p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      }
      return true
    })
  }, [produtos, busca, grupo, filtroPromo, promocoes])

  const qtdEmPromocao = useMemo(() => {
    return produtos.filter(p => promocoes[p._id]).length
  }, [produtos, promocoes])

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

      {/* Banner de promocao */}
      {temPromocoes && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={18} className="animate-bounce" />
              <span className="font-bold text-sm">PROMOCAO ATIVA!</span>
              <span className="text-sm opacity-90">{qtdEmPromocao} produto(s) com desconto</span>
            </div>
            <button
              onClick={() => setFiltroPromo(!filtroPromo)}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                filtroPromo ? 'bg-white text-red-600' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {filtroPromo ? 'Ver todos' : 'Ver ofertas'}
            </button>
          </div>
        </div>
      )}

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
          {temPromocoes && (
            <button
              onClick={() => setFiltroPromo(!filtroPromo)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                filtroPromo
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Tag size={14} />
              Ofertas
            </button>
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
            {filtrados.map(p => {
              const desconto = promocoes[p._id]
              const precoFinal = desconto ? p.preco * (1 - desconto.percentual / 100) : p.preco
              return (
                <div key={p._id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow relative ${
                  desconto ? 'border-red-200' : 'border-gray-100'
                }`}>
                  {/* Badge de desconto */}
                  {desconto && (
                    <div className="absolute top-2 right-2 z-[1] bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg shadow-lg">
                      -{desconto.percentual}%
                    </div>
                  )}

                  <div className={`h-32 flex items-center justify-center ${
                    desconto
                      ? 'bg-gradient-to-br from-red-50 to-orange-50'
                      : 'bg-gradient-to-br from-indigo-50 to-purple-50'
                  }`}>
                    <Package size={40} className={desconto ? 'text-red-300' : 'text-indigo-300'} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 min-h-[2.5rem]">{p.nome}</h3>
                    {p.grupo && <p className="text-xs text-gray-400 mt-0.5">{p.grupo}</p>}

                    <div className="mt-3">
                      {desconto ? (
                        <>
                          <p className="text-sm text-red-400 line-through font-medium">{formatCurrency(p.preco)}</p>
                          <p className="text-xl font-black text-green-600">{formatCurrency(precoFinal)}</p>
                          <p className="text-[10px] font-bold text-red-500 mt-0.5">{desconto.nomePromo}</p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-indigo-600">{formatCurrency(p.preco)}</p>
                      )}
                      {p.precoAtacado && p.qtdMinimaAtacado && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">
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
                          href={`https://wa.me/55${empresa.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Ola! Tenho interesse no produto: ${p.nome} - ${formatCurrency(precoFinal)}${desconto ? ` (promocao ${desconto.percentual}% OFF)` : ''}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs font-semibold hover:underline ${desconto ? 'text-red-500' : 'text-[#25D366]'}`}
                        >
                          {desconto ? 'Aproveitar!' : 'Comprar'}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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
