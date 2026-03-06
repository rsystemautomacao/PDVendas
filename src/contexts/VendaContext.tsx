import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Venda, ItemVenda, Pagamento } from '../types'
import { StorageKeys, getAll, saveAll, generateId, getNextNumber } from '../utils/storage'
import { todayISO, isDateInRange } from '../utils/helpers'
import { useToast } from './ToastContext'
import { useAuth } from './AuthContext'
import { useProdutos } from './ProdutoContext'
import { useCaixa } from './CaixaContext'

interface VendaContextType {
  vendas: Venda[]
  loading: boolean
  // Cart state
  cart: ItemVenda[]
  clienteId: string | null
  clienteNome: string
  desconto: number
  descontoTipo: 'valor' | 'percentual'
  observacoes: string
  // Cart actions
  addToCart: (produtoId: string, quantidade?: number) => void
  removeFromCart: (produtoId: string) => void
  updateCartItem: (produtoId: string, quantidade: number) => void
  clearCart: () => void
  setClienteVenda: (id: string | null, nome: string) => void
  setDesconto: (valor: number, tipo: 'valor' | 'percentual') => void
  setObservacoesVenda: (obs: string) => void
  // Totals
  subtotal: number
  totalDesconto: number
  totalVenda: number
  // Finalização
  finalizarVenda: (pagamentos: Pagamento[]) => Venda | null
  cancelarVenda: (id: string, motivo: string) => void
  // Queries
  getVenda: (id: string) => Venda | undefined
  getVendasPorPeriodo: (de: string, ate: string) => Venda[]
  getVendasHoje: () => Venda[]
  getTotalVendasHoje: () => number
  getTotalVendasMes: () => number
}

const VendaContext = createContext<VendaContextType | null>(null)

export function useVendas() {
  const ctx = useContext(VendaContext)
  if (!ctx) throw new Error('useVendas deve ser usado dentro de VendaProvider')
  return ctx
}

export function VendaProvider({ children }: { children: ReactNode }) {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<ItemVenda[]>([])
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [clienteNome, setClienteNome] = useState('')
  const [desconto, setDescontoState] = useState(0)
  const [descontoTipo, setDescontoTipo] = useState<'valor' | 'percentual'>('valor')
  const [observacoes, setObservacoesState] = useState('')

  const toast = useToast()
  const { user } = useAuth()
  const { getProduto, atualizarEstoque } = useProdutos()
  const { caixaAberto, registrarVenda } = useCaixa()

  const reload = useCallback(() => {
    setVendas(getAll<Venda>(StorageKeys.VENDAS))
  }, [])

  useEffect(() => {
    reload()
    setLoading(false)
  }, [reload])

  // ---- Cálculos ----
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const totalDesconto = descontoTipo === 'percentual'
    ? subtotal * (desconto / 100)
    : desconto
  const totalVenda = Math.max(0, subtotal - totalDesconto)

  // ---- Cart Actions ----
  const addToCart = useCallback((produtoId: string, quantidade = 1) => {
    const produto = getProduto(produtoId)
    if (!produto) { toast.erro('Produto nao encontrado'); return }
    if (produto.tipo === 'produto' && produto.estoque < quantidade) {
      toast.alerta(`Estoque insuficiente. Disponivel: ${produto.estoque}`)
      return
    }

    setCart(prev => {
      const existing = prev.find(i => i.produtoId === produtoId)
      if (existing) {
        return prev.map(i =>
          i.produtoId === produtoId
            ? { ...i, quantidade: i.quantidade + quantidade, total: (i.quantidade + quantidade) * i.precoUnitario - i.desconto }
            : i
        )
      }
      return [...prev, {
        produtoId,
        nome: produto.nome,
        codigo: produto.codigo,
        quantidade,
        precoUnitario: produto.preco,
        desconto: 0,
        total: quantidade * produto.preco,
      }]
    })
  }, [getProduto, toast])

  const removeFromCart = useCallback((produtoId: string) => {
    setCart(prev => prev.filter(i => i.produtoId !== produtoId))
  }, [])

  const updateCartItem = useCallback((produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removeFromCart(produtoId)
      return
    }
    setCart(prev => prev.map(i =>
      i.produtoId === produtoId
        ? { ...i, quantidade, total: quantidade * i.precoUnitario - i.desconto }
        : i
    ))
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setCart([])
    setClienteId(null)
    setClienteNome('')
    setDescontoState(0)
    setDescontoTipo('valor')
    setObservacoesState('')
  }, [])

  const setClienteVenda = useCallback((id: string | null, nome: string) => {
    setClienteId(id)
    setClienteNome(nome)
  }, [])

  const setDesconto = useCallback((valor: number, tipo: 'valor' | 'percentual') => {
    setDescontoState(valor)
    setDescontoTipo(tipo)
  }, [])

  const setObservacoesVenda = useCallback((obs: string) => {
    setObservacoesState(obs)
  }, [])

  // ---- Finalização ----
  const finalizarVenda = useCallback((pagamentos: Pagamento[]) => {
    if (cart.length === 0) {
      toast.erro('Adicione pelo menos um item ao carrinho')
      return null
    }
    if (!caixaAberto) {
      toast.erro('Nao ha caixa aberto. Abra um caixa primeiro.')
      return null
    }

    const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0)
    if (totalPago < totalVenda) {
      toast.erro('Valor dos pagamentos insuficiente')
      return null
    }

    const numero = getNextNumber(StorageKeys.NEXT_VENDA_NUM)
    const troco = totalPago - totalVenda

    const venda: Venda = {
      _id: generateId(),
      numero,
      clienteId: clienteId || undefined,
      clienteNome: clienteNome || 'Consumidor Final',
      itens: [...cart],
      subtotal,
      desconto: totalDesconto,
      descontoTipo,
      total: totalVenda,
      pagamentos,
      troco,
      status: 'finalizada',
      caixaId: caixaAberto._id,
      vendedorId: user?._id || '',
      vendedorNome: user?.nome || 'Vendedor',
      observacoes: observacoes || undefined,
      criadoEm: todayISO(),
    }

    // Salvar venda
    const all = getAll<Venda>(StorageKeys.VENDAS)
    all.push(venda)
    saveAll(StorageKeys.VENDAS, all)

    // Atualizar estoque
    cart.forEach(item => {
      const prod = getProduto(item.produtoId)
      if (prod && prod.tipo === 'produto') {
        atualizarEstoque(item.produtoId, -item.quantidade)
      }
    })

    // Registrar no caixa
    registrarVenda(caixaAberto._id, totalVenda, String(numero))

    // Limpar carrinho
    clearCart()
    reload()

    toast.sucesso(`Venda #${numero} finalizada! Total: R$ ${totalVenda.toFixed(2)}${troco > 0 ? ` | Troco: R$ ${troco.toFixed(2)}` : ''}`)
    return venda
  }, [cart, caixaAberto, totalVenda, clienteId, clienteNome, subtotal, totalDesconto, descontoTipo, observacoes, user, getProduto, atualizarEstoque, registrarVenda, clearCart, reload, toast])

  const cancelarVenda = useCallback((id: string, motivo: string) => {
    const all = getAll<Venda>(StorageKeys.VENDAS)
    const idx = all.findIndex(v => v._id === id)
    if (idx === -1) return

    const venda = all[idx]
    venda.status = 'cancelada'
    venda.canceladoEm = todayISO()
    venda.motivoCancelamento = motivo

    // Devolver estoque
    venda.itens.forEach(item => {
      atualizarEstoque(item.produtoId, item.quantidade)
    })

    saveAll(StorageKeys.VENDAS, all)
    reload()
    toast.info(`Venda #${venda.numero} cancelada`)
  }, [atualizarEstoque, reload, toast])

  // ---- Queries ----
  const getVenda = useCallback((id: string) => vendas.find(v => v._id === id), [vendas])

  const getVendasPorPeriodo = useCallback((de: string, ate: string) => {
    return vendas.filter(v => v.status === 'finalizada' && isDateInRange(v.criadoEm, de, ate))
  }, [vendas])

  const getVendasHoje = useCallback(() => {
    const hoje = new Date().toISOString().substring(0, 10)
    return vendas.filter(v => v.status === 'finalizada' && v.criadoEm.substring(0, 10) === hoje)
  }, [vendas])

  const getTotalVendasHoje = useCallback(() => {
    return getVendasHoje().reduce((s, v) => s + v.total, 0)
  }, [getVendasHoje])

  const getTotalVendasMes = useCallback(() => {
    const now = new Date()
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return vendas
      .filter(v => v.status === 'finalizada' && v.criadoEm.substring(0, 7) === mesAtual)
      .reduce((s, v) => s + v.total, 0)
  }, [vendas])

  return (
    <VendaContext.Provider value={{
      vendas, loading, cart, clienteId, clienteNome, desconto, descontoTipo, observacoes,
      addToCart, removeFromCart, updateCartItem, clearCart, setClienteVenda,
      setDesconto, setObservacoesVenda,
      subtotal, totalDesconto, totalVenda,
      finalizarVenda, cancelarVenda,
      getVenda, getVendasPorPeriodo, getVendasHoje, getTotalVendasHoje, getTotalVendasMes,
    }}>
      {children}
    </VendaContext.Provider>
  )
}
