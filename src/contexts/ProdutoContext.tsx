import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Produto } from '../types'
import { api } from '../services/api'
import { useToast } from './ToastContext'
import { isCodigoBalanca, parseCodigoBalanca } from '../utils/helpers'

export interface BalancaResult {
  produto: Produto
  peso: number
  valorTotal: number
}

interface ProdutoContextType {
  produtos: Produto[]
  loading: boolean
  getProduto: (id: string) => Produto | undefined
  buscarProdutos: (termo: string) => Produto[]
  buscarPorCodigoBalanca: (codigoCompleto: string) => BalancaResult | null
  adicionarProduto: (p: Omit<Produto, '_id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Produto | null>
  atualizarProduto: (id: string, updates: Partial<Produto>) => Promise<void>
  removerProduto: (id: string) => Promise<void>
  atualizarEstoque: (id: string, quantidade: number) => Promise<void>
  produtosBaixoEstoque: () => Produto[]
  recarregar: () => Promise<void>
}

const ProdutoContext = createContext<ProdutoContextType | null>(null)

export function useProdutos() {
  const ctx = useContext(ProdutoContext)
  if (!ctx) throw new Error('useProdutos deve ser usado dentro de ProdutoProvider')
  return ctx
}

export function ProdutoProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const recarregar = useCallback(async () => {
    try {
      const res = await api.get('/produtos?limit=9999')
      if (res.success && res.data) {
        setProdutos(res.data)
      }
    } catch {
      // silencioso no reload
    }
  }, [])

  useEffect(() => {
    recarregar().finally(() => setLoading(false))
  }, [recarregar])

  const getProduto = useCallback((id: string) => {
    return produtos.find(p => p._id === id)
  }, [produtos])

  const buscarProdutos = useCallback((termo: string) => {
    const t = termo.toLowerCase()
    return produtos.filter(p =>
      p.ativo && (
        p.nome.toLowerCase().includes(t) ||
        p.codigo.toLowerCase().includes(t) ||
        (p.codigoBarras || '').includes(t)
      )
    )
  }, [produtos])

  const buscarPorCodigoBalanca = useCallback((codigoCompleto: string): BalancaResult | null => {
    if (!isCodigoBalanca(codigoCompleto)) return null
    const parsed = parseCodigoBalanca(codigoCompleto)
    if (!parsed) return null

    // Buscar produto pelo PLU (primeiros 7 digitos do codigo de barras cadastrado)
    const produto = produtos.find(p =>
      p.ativo &&
      p.modoVenda === 'balanca' &&
      p.codigoBarras &&
      p.codigoBarras === parsed.plu
    )

    if (!produto) return null

    // O codigo da balanca embute o VALOR TOTAL (em centavos), nao o peso
    // Peso = valorTotal / precoKg
    const valorTotal = parsed.valorTotal
    const peso = produto.preco > 0 ? Math.round((valorTotal / produto.preco) * 1000) / 1000 : 0

    return { produto, peso, valorTotal }
  }, [produtos])

  const adicionarProduto = useCallback(async (p: Omit<Produto, '_id' | 'criadoEm' | 'atualizadoEm'>) => {
    try {
      const res = await api.post('/produtos', p)
      if (res.success && res.data) {
        await recarregar()
        toast.sucesso(`Produto "${res.data.nome}" cadastrado com sucesso`)
        return res.data as Produto
      }
      return null
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao cadastrar produto')
      return null
    }
  }, [recarregar, toast])

  const atualizarProduto = useCallback(async (id: string, updates: Partial<Produto>) => {
    try {
      await api.put(`/produtos/${id}`, updates)
      await recarregar()
      toast.sucesso('Produto atualizado com sucesso')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao atualizar produto')
    }
  }, [recarregar, toast])

  const removerProduto = useCallback(async (id: string) => {
    try {
      await api.delete(`/produtos/${id}`)
      await recarregar()
      toast.sucesso('Produto removido')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao remover produto')
    }
  }, [recarregar, toast])

  const atualizarEstoque = useCallback(async (id: string, quantidade: number) => {
    try {
      await api.patch(`/produtos/${id}/estoque`, { operacao: 'add', quantidade })
      await recarregar()
    } catch {
      // silencioso
    }
  }, [recarregar])

  const produtosBaixoEstoque = useCallback(() => {
    return produtos.filter(p => p.ativo && p.tipo === 'produto' && p.estoque <= p.estoqueMinimo)
  }, [produtos])

  return (
    <ProdutoContext.Provider value={{
      produtos, loading, getProduto, buscarProdutos, buscarPorCodigoBalanca,
      adicionarProduto, atualizarProduto, removerProduto, atualizarEstoque,
      produtosBaixoEstoque, recarregar,
    }}>
      {children}
    </ProdutoContext.Provider>
  )
}
