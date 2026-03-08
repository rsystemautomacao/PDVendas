import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Venda, ItemVenda, Pagamento } from '../types'
import { api } from '../services/api'
import { useToast } from './ToastContext'
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
  addToCartBalanca: (produtoId: string, nome: string, codigo: string, peso: number, precoKg: number, valorTotal: number) => void
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
  finalizarVenda: (pagamentos: Pagamento[]) => Promise<Venda | null>
  cancelarVenda: (id: string, motivo: string) => Promise<void>
  // Queries
  getVenda: (id: string) => Venda | undefined
  getVendasPorPeriodo: (de: string, ate: string) => Venda[]
  getVendasHoje: () => Venda[]
  getTotalVendasHoje: () => number
  getTotalVendasMes: () => number
  recarregar: () => Promise<void>
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
  const { getProduto, recarregar: recarregarProdutos } = useProdutos()
  const { caixaAberto, recarregar: recarregarCaixas } = useCaixa()

  const recarregar = useCallback(async () => {
    try {
      const res = await api.get('/vendas?limit=9999')
      if (res.success && res.data) {
        setVendas(res.data)
      }
    } catch {
      // silencioso
    }
  }, [])

  useEffect(() => {
    recarregar().finally(() => setLoading(false))
  }, [recarregar])

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

  // Adicionar produto de balanca com peso e valor total da etiqueta
  const addToCartBalanca = useCallback((produtoId: string, nome: string, codigo: string, peso: number, precoKg: number, valorTotal: number) => {
    setCart(prev => {
      // Produtos de balanca sempre entram como nova linha (cada pesagem e unica)
      return [...prev, {
        produtoId,
        nome: `${nome} (${peso.toFixed(3)}kg)`,
        codigo,
        quantidade: peso,
        precoUnitario: precoKg,
        desconto: 0,
        total: valorTotal,
      }]
    })
  }, [])

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
  const finalizarVenda = useCallback(async (pagamentos: Pagamento[]) => {
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

    const troco = totalPago - totalVenda

    try {
      const res = await api.post('/vendas', {
        clienteId: clienteId || undefined,
        clienteNome: clienteNome || 'Consumidor Final',
        itens: cart,
        subtotal,
        desconto: totalDesconto,
        descontoTipo,
        total: totalVenda,
        pagamentos,
        troco,
        status: 'finalizada',
        caixaId: caixaAberto._id,
        observacoes: observacoes || undefined,
      })

      if (res.success && res.data) {
        const venda = res.data as Venda
        clearCart()
        // Recarregar dados que foram alterados pelo backend (estoque, caixa, vendas)
        await Promise.all([recarregar(), recarregarProdutos(), recarregarCaixas()])
        toast.sucesso(`Venda #${venda.numero} finalizada! Total: R$ ${totalVenda.toFixed(2)}${troco > 0 ? ` | Troco: R$ ${troco.toFixed(2)}` : ''}`)
        return venda
      }
      return null
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao finalizar venda')
      return null
    }
  }, [cart, caixaAberto, totalVenda, clienteId, clienteNome, subtotal, totalDesconto, descontoTipo, observacoes, clearCart, recarregar, recarregarProdutos, recarregarCaixas, toast])

  const cancelarVenda = useCallback(async (id: string, motivo: string) => {
    try {
      await api.put(`/vendas/${id}/cancelar`, { motivo })
      await Promise.all([recarregar(), recarregarProdutos()])
      toast.info('Venda cancelada')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao cancelar venda')
    }
  }, [recarregar, recarregarProdutos, toast])

  // ---- Queries ----
  const getVenda = useCallback((id: string) => vendas.find(v => v._id === id), [vendas])

  const getVendasPorPeriodo = useCallback((de: string, ate: string) => {
    return vendas.filter(v => {
      if (v.status !== 'finalizada') return false
      const d = v.criadoEm.substring(0, 10)
      return d >= de && d <= ate
    })
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
      addToCart, addToCartBalanca, removeFromCart, updateCartItem, clearCart, setClienteVenda,
      setDesconto, setObservacoesVenda,
      subtotal, totalDesconto, totalVenda,
      finalizarVenda, cancelarVenda,
      getVenda, getVendasPorPeriodo, getVendasHoje, getTotalVendasHoje, getTotalVendasMes,
      recarregar,
    }}>
      {children}
    </VendaContext.Provider>
  )
}
