import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Produto } from '../types'
import { StorageKeys, getAll, saveAll, generateId } from '../utils/storage'
import { sanitize, todayISO } from '../utils/helpers'
import { useToast } from './ToastContext'

interface ProdutoContextType {
  produtos: Produto[]
  loading: boolean
  getProduto: (id: string) => Produto | undefined
  buscarProdutos: (termo: string) => Produto[]
  adicionarProduto: (p: Omit<Produto, '_id' | 'criadoEm' | 'atualizadoEm'>) => Produto
  atualizarProduto: (id: string, updates: Partial<Produto>) => void
  removerProduto: (id: string) => void
  atualizarEstoque: (id: string, quantidade: number) => void
  produtosBaixoEstoque: () => Produto[]
}

const ProdutoContext = createContext<ProdutoContextType | null>(null)

export function useProdutos() {
  const ctx = useContext(ProdutoContext)
  if (!ctx) throw new Error('useProdutos deve ser usado dentro de ProdutoProvider')
  return ctx
}

function seedProdutos() {
  const existing = getAll<Produto>(StorageKeys.PRODUTOS)
  if (existing.length > 0) return
  const now = todayISO()
  const seed: Produto[] = [
    { _id: generateId(), nome: 'Coca-Cola 350ml', codigo: '001', codigoBarras: '7891000100103', tipo: 'produto', preco: 5.50, precoCusto: 3.20, estoque: 48, estoqueMinimo: 10, unidade: 'UN', grupo: 'Bebidas', marca: 'Coca-Cola', ativo: true, observacoes: '', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), nome: 'Pao Frances (kg)', codigo: '002', codigoBarras: '0000000000002', tipo: 'produto', preco: 14.90, precoCusto: 8.00, estoque: 25, estoqueMinimo: 5, unidade: 'KG', grupo: 'Padaria', marca: '', ativo: true, observacoes: '', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), nome: 'Arroz 5kg', codigo: '003', codigoBarras: '7891000000031', tipo: 'produto', preco: 27.90, precoCusto: 19.50, estoque: 30, estoqueMinimo: 8, unidade: 'UN', grupo: 'Alimentos', marca: 'Tio Joao', ativo: true, observacoes: '', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), nome: 'Feijao Preto 1kg', codigo: '004', codigoBarras: '7891000000048', tipo: 'produto', preco: 8.90, precoCusto: 5.50, estoque: 40, estoqueMinimo: 10, unidade: 'UN', grupo: 'Alimentos', marca: 'Camil', ativo: true, observacoes: '', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), nome: 'Leite Integral 1L', codigo: '005', codigoBarras: '7891000000055', tipo: 'produto', preco: 6.49, precoCusto: 4.20, estoque: 60, estoqueMinimo: 15, unidade: 'UN', grupo: 'Laticinios', marca: 'Parmalat', ativo: true, observacoes: '', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), nome: 'Cafe 500g', codigo: '006', codigoBarras: '7891000000062', tipo: 'produto', preco: 18.90, precoCusto: 12.00, estoque: 20, estoqueMinimo: 5, unidade: 'UN', grupo: 'Bebidas', marca: 'Pilao', ativo: true, observacoes: '', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), nome: 'Acucar 1kg', codigo: '007', codigoBarras: '7891000000079', tipo: 'produto', preco: 5.29, precoCusto: 3.50, estoque: 35, estoqueMinimo: 10, unidade: 'UN', grupo: 'Alimentos', marca: 'Uniao', ativo: true, observacoes: '', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), nome: 'Oleo de Soja 900ml', codigo: '008', codigoBarras: '7891000000086', tipo: 'produto', preco: 7.99, precoCusto: 5.00, estoque: 25, estoqueMinimo: 8, unidade: 'UN', grupo: 'Alimentos', marca: 'Soya', ativo: true, observacoes: '', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), nome: 'Servico de Entrega', codigo: '009', tipo: 'servico', preco: 10.00, estoque: 9999, estoqueMinimo: 0, unidade: 'UN', grupo: 'Servicos', ativo: true, observacoes: 'Taxa de entrega', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), nome: 'Agua Mineral 500ml', codigo: '010', codigoBarras: '7891000000109', tipo: 'produto', preco: 2.50, precoCusto: 1.20, estoque: 100, estoqueMinimo: 20, unidade: 'UN', grupo: 'Bebidas', marca: 'Crystal', ativo: true, observacoes: '', criadoEm: now, atualizadoEm: now },
  ]
  saveAll(StorageKeys.PRODUTOS, seed)
}

export function ProdutoProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const reload = useCallback(() => {
    setProdutos(getAll<Produto>(StorageKeys.PRODUTOS))
  }, [])

  useEffect(() => {
    seedProdutos()
    reload()
    setLoading(false)
  }, [reload])

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

  const adicionarProduto = useCallback((p: Omit<Produto, '_id' | 'criadoEm' | 'atualizadoEm'>) => {
    const now = todayISO()
    const novo: Produto = {
      ...p,
      nome: sanitize(p.nome),
      _id: generateId(),
      criadoEm: now,
      atualizadoEm: now,
    }
    const all = getAll<Produto>(StorageKeys.PRODUTOS)
    all.push(novo)
    saveAll(StorageKeys.PRODUTOS, all)
    reload()
    toast.sucesso(`Produto "${novo.nome}" cadastrado com sucesso`)
    return novo
  }, [reload, toast])

  const atualizarProduto = useCallback((id: string, updates: Partial<Produto>) => {
    const all = getAll<Produto>(StorageKeys.PRODUTOS)
    const idx = all.findIndex(p => p._id === id)
    if (idx === -1) return
    all[idx] = { ...all[idx], ...updates, atualizadoEm: todayISO() }
    saveAll(StorageKeys.PRODUTOS, all)
    reload()
    toast.sucesso('Produto atualizado com sucesso')
  }, [reload, toast])

  const removerProduto = useCallback((id: string) => {
    const all = getAll<Produto>(StorageKeys.PRODUTOS).filter(p => p._id !== id)
    saveAll(StorageKeys.PRODUTOS, all)
    reload()
    toast.sucesso('Produto removido')
  }, [reload, toast])

  const atualizarEstoque = useCallback((id: string, quantidade: number) => {
    const all = getAll<Produto>(StorageKeys.PRODUTOS)
    const idx = all.findIndex(p => p._id === id)
    if (idx === -1) return
    all[idx].estoque += quantidade
    if (all[idx].estoque < 0) all[idx].estoque = 0
    all[idx].atualizadoEm = todayISO()
    saveAll(StorageKeys.PRODUTOS, all)
    reload()
  }, [reload])

  const produtosBaixoEstoque = useCallback(() => {
    return produtos.filter(p => p.ativo && p.tipo === 'produto' && p.estoque <= p.estoqueMinimo)
  }, [produtos])

  return (
    <ProdutoContext.Provider value={{
      produtos, loading, getProduto, buscarProdutos, adicionarProduto,
      atualizarProduto, removerProduto, atualizarEstoque, produtosBaixoEstoque,
    }}>
      {children}
    </ProdutoContext.Provider>
  )
}
