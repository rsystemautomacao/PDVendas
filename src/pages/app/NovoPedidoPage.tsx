import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Minus, Trash2, User,
  CreditCard, Banknote, Smartphone, FileText, Printer,
  X, AlertCircle, Receipt, DollarSign, Percent, Package, Camera,
} from 'lucide-react'
import { useVendas } from '../../contexts/VendaContext'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useClientes } from '../../contexts/ClienteContext'
import { useCaixa } from '../../contexts/CaixaContext'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, isCodigoBalanca } from '../../utils/helpers'
import { imprimirRecibo, deveImprimirAutomatico } from '../../utils/impressao'
import type { Pagamento, FormaPagamento, Venda, Produto } from '../../types'
import { BarcodeScanner } from '../../components/app/BarcodeScanner'

export function NovoPedidoPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const {
    cart, addToCart, addToCartComVariacao, addToCartBalanca, removeFromCart, updateCartItem, clearCart,
    subtotal, totalDesconto, totalVenda,
    setClienteVenda, clienteId, clienteNome,
    setDesconto, finalizarVenda, setObservacoesVenda, observacoes,
  } = useVendas()
  const { produtos, buscarProdutos, buscarPorCodigoBalanca } = useProdutos()
  const { buscarClientes } = useClientes()
  const { caixaAberto } = useCaixa()

  // Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<ReturnType<typeof buscarProdutos>>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedProductIdx, setSelectedProductIdx] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)

  // Client search
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<ReturnType<typeof buscarClientes>>([])
  const [showClientResults, setShowClientResults] = useState(false)
  const [selectedClientIdx, setSelectedClientIdx] = useState(-1)
  const clientSearchRef = useRef<HTMLInputElement>(null)
  const valorPagamentoRef = useRef<HTMLInputElement>(null)

  // Payment modal
  const [showPayment, setShowPayment] = useState(false)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('dinheiro')
  const [valorPagamento, setValorPagamento] = useState('')
  const [parcelas, setParcelas] = useState(1)

  // Discount modal
  const [showDesconto, setShowDesconto] = useState(false)
  const [descontoInput, setDescontoInput] = useState('')
  const [descontoTipoInput, setDescontoTipoInput] = useState<'valor' | 'percentual'>('valor')

  // Receipt modal
  const [vendaFinalizada, setVendaFinalizada] = useState<Venda | null>(null)
  const [showRecibo, setShowRecibo] = useState(false)

  // Cart navigation
  const [selectedCartIdx, setSelectedCartIdx] = useState(-1)
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState(-1)
  const cartRef = useRef<HTMLDivElement>(null)

  // Product not found modal
  const [showNotFoundModal, setShowNotFoundModal] = useState(false)
  const [notFoundBarcode, setNotFoundBarcode] = useState('')
  const [notFoundModalReady, setNotFoundModalReady] = useState(false)

  // Payment method keyboard navigation index
  const [selectedPaymentIdx, setSelectedPaymentIdx] = useState(0)
  // Payment phase: 'method' = selecting payment method, 'value' = entering value
  const [paymentPhase, setPaymentPhase] = useState<'method' | 'value'>('method')

  // Cart management modal
  const [showCartModal, setShowCartModal] = useState(false)

  // Barcode camera scanner
  const [showScanner, setShowScanner] = useState(false)

  // Product catalog modal (F3)
  const [showProductCatalog, setShowProductCatalog] = useState(false)
  const [catalogSelectedIdx, setCatalogSelectedIdx] = useState(0)
  const [catalogSearch, setCatalogSearch] = useState('')
  const catalogSearchRef = useRef<HTMLInputElement>(null)

  // Crediario client modal
  const [showCrediarioClientModal, setShowCrediarioClientModal] = useState(false)
  const [crediarioClientSearch, setCrediarioClientSearch] = useState('')
  const [crediarioClientResults, setCrediarioClientResults] = useState<ReturnType<typeof buscarClientes>>([])
  const [crediarioSelectedIdx, setCrediarioSelectedIdx] = useState(-1)
  const crediarioSearchRef = useRef<HTMLInputElement>(null)

  // Variation/Serial selection modal
  const [showVariacaoModal, setShowVariacaoModal] = useState(false)
  const [variacaoProduto, setVariacaoProduto] = useState<Produto | null>(null)
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<string | null>(null)
  const [serialSelecionado, setSerialSelecionado] = useState<string | null>(null)

  // Caixa warning
  const [showCaixaModal, setShowCaixaModal] = useState(false)

  // Finalizing sale loading
  const [showFinalizando, setShowFinalizando] = useState(false)

  // Refresh guard modal
  const [showRefreshGuardModal, setShowRefreshGuardModal] = useState(false)

  // Cancel sale modal (ESC)
  const [showCancelVendaModal, setShowCancelVendaModal] = useState(false)

  // Navigation guard when cart has items
  const [showNavGuardModal, setShowNavGuardModal] = useState(false)
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null)
  const cartRef2 = useRef(cart)
  cartRef2.current = cart

  // Intercept link clicks when cart has items
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cartRef2.current.length === 0) return
      const link = (e.target as HTMLElement).closest('a[href]')
      if (!link) return
      const href = link.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('/app/novo-pedido')) return
      e.preventDefault()
      e.stopPropagation()
      setPendingNavPath(href)
      setShowNavGuardModal(true)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])

  // Browser close/refresh guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (cart.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [cart.length])

  useEffect(() => {
    if (!caixaAberto) setShowCaixaModal(true)
  }, [caixaAberto])

  // Sorted product catalog for F3 modal
  const catalogProducts = useMemo(() => {
    const active = produtos.filter(p => p.ativo)
    const sorted = active.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    if (!catalogSearch.trim()) return sorted
    const term = catalogSearch.toLowerCase()
    return sorted.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      p.codigo.toLowerCase().includes(term)
    )
  }, [produtos, catalogSearch])

  // Auto-focus catalog search when modal opens
  useEffect(() => {
    if (showProductCatalog) {
      setCatalogSelectedIdx(0)
      setCatalogSearch('')
      setTimeout(() => catalogSearchRef.current?.focus(), 100)
    }
  }, [showProductCatalog])

  // Enter fullscreen when page mounts, exit on unmount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen()
        }
      } catch { /* user may deny fullscreen */ }
    }
    enterFullscreen()
    return () => {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        }
      } catch { /* ignore */ }
    }
  }, [])

  // Keep selectedCartIdx in bounds when cart changes
  useEffect(() => {
    if (selectedCartIdx >= cart.length) {
      setSelectedCartIdx(cart.length - 1)
    }
  }, [cart.length, selectedCartIdx])

  // Scroll selected cart item into view
  useEffect(() => {
    if (selectedCartIdx >= 0 && cartRef.current) {
      const items = cartRef.current.querySelectorAll('[data-cart-item]')
      items[selectedCartIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedCartIdx])

  // Product search - com deteccao de codigo de balanca e barcode nao encontrado
  useEffect(() => {
    const cleanTerm = searchTerm.replace(/\D/g, '')

    // Detectar codigo de barras de balanca (13 digitos, comeca com 2)
    if (isCodigoBalanca(cleanTerm)) {
      const result = buscarPorCodigoBalanca(cleanTerm)
      if (result) {
        addToCartBalanca(
          result.produto._id,
          result.produto.nome,
          result.produto.codigo,
          result.peso,
          result.produto.preco,
          result.valorTotal
        )
        setSearchTerm('')
        setShowResults(false)
        setSelectedProductIdx(-1)
        searchRef.current?.focus()
        return
      }
    }

    if (searchTerm.length >= 2) {
      const results = buscarProdutos(searchTerm)
      setSearchResults(results)
      setShowResults(true)
      setSelectedProductIdx(0)

      // Se parece ser um codigo de barras (apenas numeros, 8+ digitos) e nao encontrou nada
      if (results.length === 0 && cleanTerm.length >= 8 && cleanTerm === searchTerm.trim()) {
        // Sera tratado no dropdown com botao de cadastrar
      }
    } else {
      setSearchResults([])
      setShowResults(false)
      setSelectedProductIdx(-1)
    }
  }, [searchTerm, buscarProdutos, buscarPorCodigoBalanca, addToCartBalanca])

  // Client search
  useEffect(() => {
    if (clientSearch.length >= 2) {
      setClientResults(buscarClientes(clientSearch))
      setShowClientResults(true)
      setSelectedClientIdx(0)
    } else {
      setClientResults([])
      setShowClientResults(false)
      setSelectedClientIdx(-1)
    }
  }, [clientSearch, buscarClientes])

  const handleBarcodeScan = useCallback((code: string) => {
    setShowScanner(false)
    // Feed the scanned code into the search field - the existing useEffect handles the rest
    setSearchTerm(code.trim())
    searchRef.current?.focus()
  }, [])

  const handleAddProduct = useCallback((produtoId: string) => {
    const prod = produtos.find(p => p._id === produtoId)
    // Se tem variações ou serial, abrir modal de seleção
    if (prod && (prod.temVariacoes && prod.variacoes && prod.variacoes.length > 0)) {
      setVariacaoProduto(prod)
      setVariacaoSelecionada(null)
      setSerialSelecionado(null)
      setShowVariacaoModal(true)
      setSearchTerm('')
      setShowResults(false)
      return
    }
    if (prod && (prod.temSerial && prod.seriais && prod.seriais.some(s => s.status === 'disponivel'))) {
      setVariacaoProduto(prod)
      setVariacaoSelecionada(null)
      setSerialSelecionado(null)
      setShowVariacaoModal(true)
      setSearchTerm('')
      setShowResults(false)
      return
    }
    addToCart(produtoId)
    setSearchTerm('')
    setShowResults(false)
    setSelectedProductIdx(-1)
    setSelectedCartIdx(-1)
    searchRef.current?.focus()
  }, [addToCart, produtos])

  const handleSelectClient = useCallback((id: string, nome: string) => {
    setClienteVenda(id, nome)
    setClientSearch('')
    setShowClientResults(false)
    setSelectedClientIdx(-1)
  }, [setClienteVenda])

  // Keyboard nav for product search dropdown
  const handleProductSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Enter com codigo de barras nao encontrado: abrir modal de confirmacao
    if (e.key === 'Enter') {
      const cleanTerm = searchTerm.replace(/\D/g, '')
      // Codigo de barras (8+ digitos) sem resultados → modal de confirmacao
      if (cleanTerm.length >= 8 && cleanTerm === searchTerm.trim() && (searchResults.length === 0 || !showResults)) {
        e.preventDefault()
        setNotFoundBarcode(searchTerm.trim())
        setShowNotFoundModal(true)
        setShowResults(false)
        return
      }
      // Se tem resultados e um item selecionado, adicionar ao carrinho
      if (showResults && selectedProductIdx >= 0 && selectedProductIdx < searchResults.length) {
        e.preventDefault()
        handleAddProduct(searchResults[selectedProductIdx]._id)
        return
      }
      // Se tem resultados mas nenhum selecionado e é codigo numerico sem match
      if (showResults && searchResults.length === 0 && cleanTerm.length >= 8) {
        e.preventDefault()
        setNotFoundBarcode(searchTerm.trim())
        setShowNotFoundModal(true)
        setShowResults(false)
        return
      }
      return
    }

    if (!showResults || searchResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedProductIdx(prev => (prev + 1) % searchResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedProductIdx(prev => (prev - 1 + searchResults.length) % searchResults.length)
    } else if (e.key === 'Tab') {
      if (selectedProductIdx >= 0 && selectedProductIdx < searchResults.length) {
        e.preventDefault()
        handleAddProduct(searchResults[selectedProductIdx]._id)
      }
    }
  }, [showResults, searchResults, searchTerm, selectedProductIdx, handleAddProduct])

  // Keyboard nav for client search dropdown
  const handleClientSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    // F6: cadastrar novo cliente
    if (e.key === 'F6') {
      e.preventDefault()
      navigate('/app/clientes/novo', { state: { returnTo: '/app/novo-pedido' } })
      return
    }

    if (!showClientResults || clientResults.length === 0) {
      // Enter ou setas sem resultados: nada a fazer
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedClientIdx(prev => (prev + 1) % clientResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedClientIdx(prev => (prev - 1 + clientResults.length) % clientResults.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (selectedClientIdx >= 0 && selectedClientIdx < clientResults.length) {
        e.preventDefault()
        handleSelectClient(clientResults[selectedClientIdx]._id, clientResults[selectedClientIdx].nome)
      }
    }
  }, [showClientResults, clientResults, selectedClientIdx, handleSelectClient])

  const handleApplyDesconto = () => {
    const val = parseFloat(descontoInput) || 0
    setDesconto(val, descontoTipoInput)
    setShowDesconto(false)
  }

  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0)
  const restante = totalVenda - totalPago
  const troco = totalPago > totalVenda ? totalPago - totalVenda : 0

  // Verifica se crediario precisa de cliente
  const handleSelectFormaPagamento = useCallback((forma: FormaPagamento) => {
    if (forma === 'crediario' && !clienteId) {
      setFormaPagamento(forma)
      setShowCrediarioClientModal(true)
      return
    }
    setFormaPagamento(forma)
  }, [clienteId])

  const handleCrediarioClientSelect = useCallback((id: string, nome: string) => {
    setClienteVenda(id, nome)
    setShowCrediarioClientModal(false)
    setCrediarioClientSearch('')
    setCrediarioClientResults([])
    toast.sucesso(`Cliente ${nome} selecionado`)
  }, [setClienteVenda, toast])

  const handleAddPagamento = () => {
    const valor = parseFloat(valorPagamento) || (restante > 0 ? restante : 0)
    if (valor <= 0) return
    // Bloquear crediario sem cliente
    if (formaPagamento === 'crediario' && !clienteId) {
      setShowCrediarioClientModal(true)
      return
    }
    setPagamentos(prev => [...prev, {
      forma: formaPagamento,
      valor,
      parcelas: (formaPagamento === 'credito' || formaPagamento === 'crediario') ? parcelas : undefined,
    }])
    setValorPagamento('')
  }

  const handleRemovePagamento = (index: number) => {
    setPagamentos(prev => prev.filter((_, i) => i !== index))
  }

  const handleFinalizarVenda = async () => {
    if (pagamentos.length === 0) {
      toast.erro('Adicione pelo menos uma forma de pagamento')
      return
    }
    // Bloquear se tem crediario sem cliente
    if (pagamentos.some(p => p.forma === 'crediario') && !clienteId) {
      toast.erro('Selecione um cliente para venda no crediario')
      setShowCrediarioClientModal(true)
      return
    }
    if (totalPago < totalVenda) {
      toast.erro('Valor dos pagamentos insuficiente')
      return
    }
    setShowFinalizando(true)
    // Delay visual mínimo para UX
    const [venda] = await Promise.all([
      finalizarVenda(pagamentos),
      new Promise(r => setTimeout(r, 1500)),
    ])
    setShowFinalizando(false)
    if (venda) {
      setVendaFinalizada(venda)
      setShowRecibo(true)
      setShowPayment(false)
      setPagamentos([])
    }
  }

  const gerarReciboHtml = useCallback((venda: Venda) => {
    const logo = user?.empresa?.logoBase64
      ? `<div class="centro"><img src="${user.empresa.logoBase64}" alt="Logo" /></div>`
      : ''
    const cnpj = user?.empresa?.cnpj ? `<div class="centro" style="font-size:10px">CNPJ: ${user.empresa.cnpj}</div>` : ''
    const tel = user?.empresa?.telefone ? `<div class="centro" style="font-size:10px">Tel: ${user.empresa.telefone}</div>` : ''
    const itensHtml = venda.itens.map(item =>
      `<div>${item.nome}<br/>&nbsp;&nbsp;${item.quantidade}x ${formatCurrency(item.precoUnitario)} = ${formatCurrency(item.total)}</div>`
    ).join('')
    const pagHtml = venda.pagamentos.map(p =>
      `<div style="text-transform:capitalize">${p.forma}: ${formatCurrency(p.valor)}${p.parcelas && p.parcelas > 1 ? ` (${p.parcelas}x)` : ''}</div>`
    ).join('')
    return `
      ${logo}
      <div class="centro bold">${user?.empresa?.nome || 'COMPROVANTE DE VENDA'}</div>
      ${cnpj}${tel}
      <div class="linha"></div>
      <div>Venda #${venda.numero}</div>
      <div>Data: ${new Date(venda.criadoEm).toLocaleString('pt-BR')}</div>
      <div>Cliente: ${venda.clienteNome}</div>
      <div>Vendedor: ${venda.vendedorNome}</div>
      <div class="linha"></div>
      <div class="bold">ITENS:</div>
      ${itensHtml}
      <div class="linha"></div>
      <div>Subtotal: ${formatCurrency(venda.subtotal)}</div>
      ${venda.desconto > 0 ? `<div>Desconto: -${formatCurrency(venda.desconto)}</div>` : ''}
      <div class="bold">TOTAL: ${formatCurrency(venda.total)}</div>
      <div class="linha"></div>
      <div class="bold">PAGAMENTO:</div>
      ${pagHtml}
      ${venda.troco > 0 ? `<div>Troco: ${formatCurrency(venda.troco)}</div>` : ''}
      <div class="linha"></div>
      <div class="centro">Obrigado pela preferencia!</div>
    `
  }, [user])

  const imprimirReciboVenda = useCallback(() => {
    if (!vendaFinalizada) return
    const html = gerarReciboHtml(vendaFinalizada)
    imprimirRecibo(html)
  }, [vendaFinalizada, gerarReciboHtml])

  const enviarReciboWhatsApp = useCallback(() => {
    if (!vendaFinalizada) return
    const v = vendaFinalizada
    const empresa = user?.empresa?.nome || 'MeuPDV'
    const cnpj = user?.empresa?.cnpj ? `CNPJ: ${user.empresa.cnpj}\n` : ''
    const tel = user?.empresa?.telefone ? `Tel: ${user.empresa.telefone}\n` : ''
    const itens = v.itens.map(item =>
      `  ${item.nome}\n    ${item.quantidade}x ${formatCurrency(item.precoUnitario)} = ${formatCurrency(item.total)}`
    ).join('\n')
    const pags = v.pagamentos.map(p =>
      `  ${p.forma.charAt(0).toUpperCase() + p.forma.slice(1)}: ${formatCurrency(p.valor)}${p.parcelas && p.parcelas > 1 ? ` (${p.parcelas}x)` : ''}`
    ).join('\n')
    const texto = [
      `*${empresa}*`,
      cnpj + tel,
      `━━━━━━━━━━━━━━━━━━`,
      `*Venda #${v.numero}*`,
      `Data: ${new Date(v.criadoEm).toLocaleString('pt-BR')}`,
      v.clienteNome ? `Cliente: ${v.clienteNome}` : '',
      `Vendedor: ${v.vendedorNome}`,
      `━━━━━━━━━━━━━━━━━━`,
      `*ITENS:*`,
      itens,
      `━━━━━━━━━━━━━━━━━━`,
      `Subtotal: ${formatCurrency(v.subtotal)}`,
      v.desconto > 0 ? `Desconto: -${formatCurrency(v.desconto)}` : '',
      `*TOTAL: ${formatCurrency(v.total)}*`,
      `━━━━━━━━━━━━━━━━━━`,
      `*PAGAMENTO:*`,
      pags,
      v.troco > 0 ? `Troco: ${formatCurrency(v.troco)}` : '',
      `━━━━━━━━━━━━━━━━━━`,
      `Obrigado pela preferencia! 🛒`,
    ].filter(Boolean).join('\n')
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }, [vendaFinalizada, user])

  // Auto-print receipt when sale is finalized (if configured)
  useEffect(() => {
    if (showRecibo && vendaFinalizada && deveImprimirAutomatico()) {
      const timer = setTimeout(() => {
        const html = gerarReciboHtml(vendaFinalizada)
        imprimirRecibo(html)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [showRecibo, vendaFinalizada, gerarReciboHtml])

  const handleNovaVenda = () => {
    setVendaFinalizada(null)
    setShowRecibo(false)
    clearCart()
    searchRef.current?.focus()
  }

  const formasPagamento: { key: FormaPagamento; label: string; icon: typeof Banknote; shortcut: string }[] = [
    { key: 'dinheiro', label: 'Dinheiro', icon: Banknote, shortcut: '1' },
    { key: 'credito', label: 'Credito', icon: CreditCard, shortcut: '2' },
    { key: 'debito', label: 'Debito', icon: CreditCard, shortcut: '3' },
    { key: 'pix', label: 'PIX', icon: Smartphone, shortcut: '4' },
    { key: 'crediario', label: 'Crediario', icon: FileText, shortcut: '5' },
  ]

  // Delay not-found modal readiness to prevent scanner Enter from auto-confirming
  useEffect(() => {
    if (showNotFoundModal) {
      setNotFoundModalReady(false)
      const t = setTimeout(() => setNotFoundModalReady(true), 300)
      return () => clearTimeout(t)
    }
    setNotFoundModalReady(false)
  }, [showNotFoundModal])

  // Crediario client search
  useEffect(() => {
    if (crediarioClientSearch.length >= 2) {
      setCrediarioClientResults(buscarClientes(crediarioClientSearch))
      setCrediarioSelectedIdx(0)
    } else {
      setCrediarioClientResults([])
      setCrediarioSelectedIdx(-1)
    }
  }, [crediarioClientSearch, buscarClientes])

  // Auto-focus crediario search input
  useEffect(() => {
    if (showCrediarioClientModal) {
      setTimeout(() => crediarioSearchRef.current?.focus(), 100)
    }
  }, [showCrediarioClientModal])

  // Sync selectedPaymentIdx with formaPagamento
  useEffect(() => {
    const idx = formasPagamento.findIndex(f => f.key === formaPagamento)
    if (idx >= 0) setSelectedPaymentIdx(idx)
  }, [formaPagamento])

  // Reset payment phase when modal opens
  useEffect(() => {
    if (showPayment) {
      setPaymentPhase('method')
      setSelectedPaymentIdx(formasPagamento.findIndex(f => f.key === formaPagamento) || 0)
    }
  }, [showPayment])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.tagName === 'SELECT'
      const isSearchFocused = document.activeElement === searchRef.current || document.activeElement === clientSearchRef.current
      const isPaymentValueFocused = document.activeElement === valorPagamentoRef.current

      // === Interceptar F5 / Ctrl+R quando carrinho tem itens ===
      if (cart.length > 0 && ((e.key === 'F5') || (e.key === 'r' && (e.ctrlKey || e.metaKey)))) {
        e.preventDefault()
        setShowRefreshGuardModal(true)
        return
      }

      // === Modal Refresh Guard ===
      if (showRefreshGuardModal) {
        if (e.key === 'Enter') { e.preventDefault(); setShowRefreshGuardModal(false); window.location.reload(); return }
        if (e.key === 'Escape') { e.preventDefault(); setShowRefreshGuardModal(false); return }
        e.preventDefault()
        return
      }

      // === Modal "produto nao encontrado" ===
      if (showNotFoundModal) {
        if (e.key === 'Enter' && notFoundModalReady) { e.preventDefault(); navigate('/app/produtos/novo', { state: { codigoBarras: notFoundBarcode, returnTo: '/app/novo-pedido' } }); return }
        if (e.key === 'Escape') { e.preventDefault(); setShowNotFoundModal(false); setSearchTerm(''); searchRef.current?.focus(); return }
        e.preventDefault()
        return
      }

      // === Modal Cancelar Venda ===
      if (showCancelVendaModal) {
        if (e.key === 'Enter') { e.preventDefault(); clearCart(); setShowCancelVendaModal(false); toast.sucesso('Venda cancelada'); searchRef.current?.focus(); return }
        if (e.key === 'Escape') { e.preventDefault(); setShowCancelVendaModal(false); return }
        e.preventDefault()
        return
      }

      // === Modal Guarda de Navegação ===
      if (showNavGuardModal) {
        if (e.key === 'Enter') { e.preventDefault(); setShowNavGuardModal(false); if (pendingNavPath) { navigate(pendingNavPath); setPendingNavPath(null) }; return }
        if (e.key === 'Escape') { e.preventDefault(); setShowNavGuardModal(false); setPendingNavPath(null); return }
        e.preventDefault()
        return
      }

      // === Confirmação de exclusão ===
      if (confirmDeleteIdx >= 0) {
        if (e.key === 'Enter') { e.preventDefault(); removeFromCart(confirmDeleteIdx); setConfirmDeleteIdx(-1); return }
        if (e.key === 'Escape') { e.preventDefault(); setConfirmDeleteIdx(-1); return }
        return
      }

      // === Modal Recibo ===
      if (showRecibo) {
        if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); handleNovaVenda(); return }
        if (e.key === 'p' || e.key === 'P') { e.preventDefault(); imprimirReciboVenda(); return }
        if (e.key === 'Escape') { e.preventDefault(); handleNovaVenda(); return }
        return
      }

      // === Modal Crediario - Selecionar Cliente ===
      if (showCrediarioClientModal) {
        if (e.key === 'Escape') { e.preventDefault(); setShowCrediarioClientModal(false); return }
        if (e.key === 'F6') { e.preventDefault(); navigate('/app/clientes/novo', { state: { returnTo: '/app/novo-pedido' } }); return }
        if (e.key === 'ArrowDown' && crediarioClientResults.length > 0) {
          e.preventDefault()
          setCrediarioSelectedIdx(prev => (prev + 1) % crediarioClientResults.length)
          return
        }
        if (e.key === 'ArrowUp' && crediarioClientResults.length > 0) {
          e.preventDefault()
          setCrediarioSelectedIdx(prev => (prev - 1 + crediarioClientResults.length) % crediarioClientResults.length)
          return
        }
        if (e.key === 'Enter' && crediarioSelectedIdx >= 0 && crediarioSelectedIdx < crediarioClientResults.length) {
          e.preventDefault()
          handleCrediarioClientSelect(crediarioClientResults[crediarioSelectedIdx]._id, crediarioClientResults[crediarioSelectedIdx].nome)
          return
        }
        return
      }

      // === Modal Carrinho ===
      if (showCartModal) {
        if (e.key === 'Escape') { e.preventDefault(); setShowCartModal(false); setSelectedCartIdx(-1); searchRef.current?.focus(); return }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedCartIdx(prev => prev < cart.length - 1 ? prev + 1 : 0)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedCartIdx(prev => prev > 0 ? prev - 1 : cart.length - 1)
          return
        }
        if (e.key === 'Delete' && selectedCartIdx >= 0) {
          e.preventDefault()
          setConfirmDeleteIdx(selectedCartIdx)
          return
        }
        if (e.key === '+' && selectedCartIdx >= 0) {
          e.preventDefault()
          updateCartItem(selectedCartIdx, cart[selectedCartIdx].quantidade + 1)
          return
        }
        if (e.key === '-' && selectedCartIdx >= 0) {
          e.preventDefault()
          if (cart[selectedCartIdx].quantidade <= 1) {
            setConfirmDeleteIdx(selectedCartIdx)
          } else {
            updateCartItem(selectedCartIdx, cart[selectedCartIdx].quantidade - 1)
          }
          return
        }
        return
      }

      // === Modal Catalogo de Produtos (F3) ===
      if (showProductCatalog) {
        if (e.key === 'Escape') { e.preventDefault(); setShowProductCatalog(false); searchRef.current?.focus(); return }
        if (e.key === 'F3') { e.preventDefault(); setShowProductCatalog(false); searchRef.current?.focus(); return }
        // Allow typing in search
        if (document.activeElement === catalogSearchRef.current) {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setCatalogSelectedIdx(prev => prev < catalogProducts.length - 1 ? prev + 1 : 0)
            return
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setCatalogSelectedIdx(prev => prev > 0 ? prev - 1 : catalogProducts.length - 1)
            return
          }
          if (e.key === 'Enter' && catalogSelectedIdx >= 0 && catalogSelectedIdx < catalogProducts.length) {
            e.preventDefault()
            handleAddProduct(catalogProducts[catalogSelectedIdx]._id)
            setShowProductCatalog(false)
            return
          }
          return
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setCatalogSelectedIdx(prev => prev < catalogProducts.length - 1 ? prev + 1 : 0)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setCatalogSelectedIdx(prev => prev > 0 ? prev - 1 : catalogProducts.length - 1)
          return
        }
        if (e.key === 'Enter' && catalogSelectedIdx >= 0 && catalogSelectedIdx < catalogProducts.length) {
          e.preventDefault()
          handleAddProduct(catalogProducts[catalogSelectedIdx]._id)
          setShowProductCatalog(false)
          return
        }
        return
      }

      // === Modal Pagamento ===
      if (showPayment) {
        // Esc: fechar modal
        if (e.key === 'Escape') { e.preventDefault(); setShowPayment(false); searchRef.current?.focus(); return }

        // Fase 'method': selecionando forma de pagamento
        if (paymentPhase === 'method') {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            setSelectedPaymentIdx(prev => {
              const newIdx = prev > 0 ? prev - 1 : formasPagamento.length - 1
              setFormaPagamento(formasPagamento[newIdx].key)
              return newIdx
            })
            return
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            setSelectedPaymentIdx(prev => {
              const newIdx = prev < formasPagamento.length - 1 ? prev + 1 : 0
              setFormaPagamento(formasPagamento[newIdx].key)
              return newIdx
            })
            return
          }
          // 1-5: selecionar forma e ir para valor
          const paymentKeys: Record<string, FormaPagamento> = {
            '1': 'dinheiro', '2': 'credito', '3': 'debito', '4': 'pix', '5': 'crediario'
          }
          if (paymentKeys[e.key]) {
            e.preventDefault()
            handleSelectFormaPagamento(paymentKeys[e.key])
            if (paymentKeys[e.key] === 'crediario' && !clienteId) return
            setPaymentPhase('value')
            setTimeout(() => valorPagamentoRef.current?.focus(), 50)
            return
          }
          // Enter: confirmar forma selecionada e ir para valor
          if (e.key === 'Enter') {
            e.preventDefault()
            if (formaPagamento === 'crediario' && !clienteId) {
              setShowCrediarioClientModal(true)
              return
            }
            setPaymentPhase('value')
            setTimeout(() => valorPagamentoRef.current?.focus(), 50)
            return
          }
          // F10/F12 funcionam em qualquer fase
          if (e.key === 'F10') {
            e.preventDefault()
            if (restante > 0) {
              const newPagamentos = [...pagamentos, { forma: formaPagamento, valor: restante, parcelas: (formaPagamento === 'credito' || formaPagamento === 'crediario') ? parcelas : undefined }]
              setPagamentos(newPagamentos)
              setTimeout(async () => {
                const totalP = newPagamentos.reduce((s, p) => s + p.valor, 0)
                if (totalP >= totalVenda) {
                  const venda = await finalizarVenda(newPagamentos)
                  if (venda) { setVendaFinalizada(venda); setShowRecibo(true); setShowPayment(false); setPagamentos([]) }
                }
              }, 50)
            } else if (totalPago >= totalVenda) { handleFinalizarVenda() }
            return
          }
          if (e.key === 'F12') { e.preventDefault(); handleFinalizarVenda(); return }
          return
        }

        // Fase 'value': digitando valor
        // Tab ou Backspace no campo vazio: voltar para seleção de método
        if (e.key === 'Tab' && !e.shiftKey) {
          // Nao deixar Tab sair do modal
          e.preventDefault()
          return
        }
        if (e.key === 'Backspace' && isPaymentValueFocused && valorPagamento === '') {
          e.preventDefault()
          setPaymentPhase('method')
          ;(document.activeElement as HTMLElement)?.blur()
          return
        }

        // Setas ←→ para voltar a navegar formas de pagamento
        if (e.key === 'ArrowLeft' && isPaymentValueFocused && valorPagamento === '') {
          e.preventDefault()
          setPaymentPhase('method')
          ;(document.activeElement as HTMLElement)?.blur()
          setSelectedPaymentIdx(prev => {
            const newIdx = prev > 0 ? prev - 1 : formasPagamento.length - 1
            setFormaPagamento(formasPagamento[newIdx].key)
            return newIdx
          })
          return
        }
        if (e.key === 'ArrowRight' && isPaymentValueFocused && valorPagamento === '') {
          e.preventDefault()
          setPaymentPhase('method')
          ;(document.activeElement as HTMLElement)?.blur()
          setSelectedPaymentIdx(prev => {
            const newIdx = prev < formasPagamento.length - 1 ? prev + 1 : 0
            setFormaPagamento(formasPagamento[newIdx].key)
            return newIdx
          })
          return
        }

        // Space no campo de valor: preencher com restante
        if (e.key === ' ' && isPaymentValueFocused) {
          e.preventDefault()
          if (restante > 0) {
            setValorPagamento(restante.toFixed(2))
          }
          return
        }

        // Enter no campo de valor: adicionar pagamento
        if (e.key === 'Enter' && isPaymentValueFocused) {
          e.preventDefault()
          handleAddPagamento()
          // Voltar para selecao de metodo apos adicionar
          setPaymentPhase('method')
          ;(document.activeElement as HTMLElement)?.blur()
          return
        }

        // F10: finalizar venda rapido (adicionar restante + finalizar)
        if (e.key === 'F10') {
          e.preventDefault()
          if (restante > 0) {
            const newPagamentos = [...pagamentos, { forma: formaPagamento, valor: restante, parcelas: (formaPagamento === 'credito' || formaPagamento === 'crediario') ? parcelas : undefined }]
            setPagamentos(newPagamentos)
            setTimeout(async () => {
              const totalP = newPagamentos.reduce((s, p) => s + p.valor, 0)
              if (totalP >= totalVenda) {
                const venda = await finalizarVenda(newPagamentos)
                if (venda) { setVendaFinalizada(venda); setShowRecibo(true); setShowPayment(false); setPagamentos([]) }
              }
            }, 50)
          } else if (totalPago >= totalVenda) { handleFinalizarVenda() }
          return
        }

        // F12: finalizar venda (quando pagamento ja esta completo)
        if (e.key === 'F12') {
          e.preventDefault()
          handleFinalizarVenda()
          return
        }

        return
      }

      // === Tela principal (sem modais) ===

      // F-keys (funcionam sempre, inclusive quando busca esta focada)
      if (e.key === 'F2') { e.preventDefault(); setSelectedCartIdx(-1); searchRef.current?.focus(); return }
      if (e.key === 'F3') { e.preventDefault(); setShowProductCatalog(true); return }
      if (e.key === 'F4') { e.preventDefault(); clientSearchRef.current?.focus(); return }
      if (e.key === 'F6') { e.preventDefault(); navigate('/app/clientes/novo', { state: { returnTo: '/app/novo-pedido' } }); return }
      if (e.key === 'F9') { e.preventDefault(); if (cart.length > 0 && caixaAberto) setShowPayment(true); return }
      if (e.key === 'Escape') {
        if (showDesconto) { setShowDesconto(false); return }
        if (showResults) { setShowResults(false); return }
        if (showClientResults) { setShowClientResults(false); return }
        if (selectedCartIdx >= 0) { setSelectedCartIdx(-1); searchRef.current?.focus(); return }
        if (cart.length > 0) { e.preventDefault(); setShowCancelVendaModal(true); return }
      }

      // Navegação do carrinho (quando NAO esta digitando na busca)
      if (!isSearchFocused && !showDesconto && cart.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedCartIdx(prev => prev < cart.length - 1 ? prev + 1 : 0)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedCartIdx(prev => prev > 0 ? prev - 1 : cart.length - 1)
          return
        }
        if (e.key === 'Delete' && selectedCartIdx >= 0) {
          e.preventDefault()
          setConfirmDeleteIdx(selectedCartIdx)
          return
        }
        if (e.key === '+' && selectedCartIdx >= 0 && !isInput) {
          e.preventDefault()
          updateCartItem(selectedCartIdx, cart[selectedCartIdx].quantidade + 1)
          return
        }
        if (e.key === '-' && selectedCartIdx >= 0 && !isInput) {
          e.preventDefault()
          if (cart[selectedCartIdx].quantidade <= 1) {
            setConfirmDeleteIdx(selectedCartIdx)
          } else {
            updateCartItem(selectedCartIdx, cart[selectedCartIdx].quantidade - 1)
          }
          return
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cart, caixaAberto, showPayment, showDesconto, showRecibo, showResults, showClientResults, showNotFoundModal, showCartModal, showCrediarioClientModal, showCancelVendaModal, showNavGuardModal, showRefreshGuardModal, showProductCatalog, catalogProducts, catalogSelectedIdx, pendingNavPath, notFoundBarcode, notFoundModalReady, formaPagamento, formasPagamento, restante, totalPago, totalVenda, pagamentos, parcelas, selectedCartIdx, confirmDeleteIdx, selectedPaymentIdx, paymentPhase, valorPagamento, clienteId, crediarioClientResults, crediarioSelectedIdx, removeFromCart, updateCartItem, clearCart, handleFinalizarVenda, handleNovaVenda, handleSelectFormaPagamento, handleCrediarioClientSelect, handleAddProduct, finalizarVenda, navigate, toast])

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
      {/* ====== LEFT PANEL - Products ====== */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Nova Venda</h1>
            {caixaAberto && (
              <p className="text-xs text-gray-500 mt-0.5">Caixa #{caixaAberto.numero} aberto</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowDesconto(true)} className="btn-ghost text-xs" title="Desconto">
              <Percent size={16} /> Desconto
            </button>
            <button onClick={clearCart} className="btn-ghost text-xs text-red-500 hover:text-red-700" disabled={cart.length === 0}>
              <Trash2 size={16} /> Limpar
            </button>
          </div>
        </div>

        {/* Client selector */}
        <div className="mb-3 relative">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400 flex-shrink-0" />
            {clienteNome ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium text-gray-700">{clienteNome}</span>
                <button onClick={() => { setClienteVenda(null, ''); setClientSearch('') }} className="text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <input
                ref={clientSearchRef}
                type="text"
                placeholder="Buscar cliente (F4) | Novo cliente (F6)"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                onKeyDown={handleClientSearchKeyDown}
                onBlur={() => setTimeout(() => setShowClientResults(false), 200)}
                className="flex-1 text-sm border-0 border-b border-gray-200 py-1.5 focus:border-primary focus:ring-0 bg-transparent"
              />
            )}
          </div>
          {showClientResults && clientResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto animate-scale-in">
              {clientResults.map((c, idx) => (
                <button key={c._id} onClick={() => handleSelectClient(c._id, c.nome)}
                  className={`w-full text-left px-4 py-2.5 text-sm border-b last:border-0 flex items-center justify-between ${
                    idx === selectedClientIdx ? 'bg-blue-50 ring-1 ring-inset ring-primary/30' : 'hover:bg-gray-50'
                  }`}>
                  <span className="font-medium">{c.nome}</span>
                  <span className="text-xs text-gray-400">{c.cpfCnpj}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product search */}
        <div className="relative mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar produto por nome, codigo ou codigo de barras... (F2)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleProductSearchKeyDown}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              onFocus={() => { if (searchTerm.length >= 2) setShowResults(true) }}
              className="input-field pl-10"
              autoFocus
            />
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto animate-scale-in">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-500 mb-2">Nenhum produto encontrado</p>
                    {searchTerm.replace(/\D/g, '').length >= 8 && (
                      <button
                        onClick={() => { setNotFoundBarcode(searchTerm.trim()); setShowNotFoundModal(true); setShowResults(false) }}
                        className="w-full text-left px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} className="text-amber-600" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Cadastrar novo produto</p>
                          <p className="text-xs text-amber-600">Codigo: {searchTerm.trim()}</p>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  searchResults.map((p, idx) => (
                    <button key={p._id} onClick={() => handleAddProduct(p._id)}
                      className={`w-full text-left px-4 py-3 border-b last:border-0 flex items-center justify-between transition-colors ${
                        idx === selectedProductIdx ? 'bg-blue-50 ring-1 ring-inset ring-primary/30' : 'hover:bg-blue-50'
                      }`}>
                      <div>
                        <p className="font-medium text-sm text-gray-800">{p.nome}</p>
                        <p className="text-xs text-gray-400">Cod: {p.codigo} | Estoque: {p.estoque} {p.unidade}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-primary">{formatCurrency(p.preco)}</p>
                        {p.precoAtacado && p.qtdMinimaAtacado && (
                          <p className="text-[10px] text-green-600">Atacado: {formatCurrency(p.precoAtacado)} ({p.qtdMinimaAtacado}+un)</p>
                        )}
                        <Plus size={16} className="text-primary ml-auto" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shrink-0"
            title="Escanear codigo de barras com camera"
          >
            <Camera size={20} />
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto" ref={cartRef}>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl scale-150" />
                <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl px-12 py-8 shadow-xl">
                  <div className="text-4xl font-black tracking-wider text-center">CAIXA LIVRE</div>
                  <div className="text-emerald-100 text-sm text-center mt-2 font-medium">Aguardando leitura de produtos</div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-gray-400">
                <span className="bg-gray-100 px-3 py-1.5 rounded-lg font-medium">F2 Buscar</span>
                <span className="bg-gray-100 px-3 py-1.5 rounded-lg font-medium">F3 Produtos</span>
                <span className="bg-gray-100 px-3 py-1.5 rounded-lg font-medium">F4 Cliente</span>
                <span className="bg-gray-100 px-3 py-1.5 rounded-lg font-medium">F9 Pagamento</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div key={`${item.produtoId}-${idx}`} data-cart-item
                  className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 animate-fade-in transition-all cursor-pointer ${
                    selectedCartIdx === idx
                      ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                      : 'border-gray-100 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedCartIdx(idx)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0 ${
                    selectedCartIdx === idx ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{item.nome}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.precoUnitario)} / un</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); updateCartItem(idx, item.quantidade - 1) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={item.quantidade}
                      onChange={e => updateCartItem(idx, parseInt(e.target.value) || 1)}
                      onClick={e => e.stopPropagation()}
                      className="w-12 text-center text-sm font-semibold border border-gray-200 rounded-lg py-1"
                      min={1}
                      tabIndex={-1}
                    />
                    <button onClick={(e) => { e.stopPropagation(); updateCartItem(idx, item.quantidade + 1) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-bold text-sm text-gray-800 w-24 text-right flex-shrink-0">{formatCurrency(item.total)}</p>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteIdx(idx) }}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observations */}
        {cart.length > 0 && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Observacoes da venda (opcional)"
              value={observacoes}
              onChange={e => setObservacoesVenda(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
        )}
      </div>

      {/* ====== RIGHT PANEL - Summary ====== */}
      <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white flex flex-col">
        <div className="p-4 lg:p-5 flex-1">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Resumo</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Itens ({cart.reduce((s, i) => s + i.quantidade, 0)})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totalDesconto > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto</span>
                <span>-{formatCurrency(totalDesconto)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold text-gray-800">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(totalVenda)}</span>
              </div>
            </div>
          </div>

          {/* Client info */}
          {clienteNome && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Cliente: {clienteNome}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={() => {
              if (!caixaAberto) { setShowCaixaModal(true); return }
              if (cart.length === 0) { toast.alerta('Adicione produtos ao carrinho'); return }
              setShowPayment(true)
            }}
            className="btn-primary w-full"
            disabled={cart.length === 0}
          >
            <DollarSign size={18} /> Finalizar Venda (F9)
          </button>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-400 justify-center">
            <span>F2: Buscar</span>
            <span>F3: Produtos</span>
            <span>F4: Cliente</span>
            <span>F6: Novo Cliente</span>
            <span>F9: Pagar</span>
            <span>↑↓: Navegar</span>
            <span>Del: Remover</span>
            <span>+/-: Qtd</span>
          </div>
        </div>
      </div>

      {/* ====== MODAL: Gerenciar Carrinho ====== */}
      {showCartModal && cart.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">Carrinho ({cart.length} itens)</h3>
              <button onClick={() => { setShowCartModal(false); setSelectedCartIdx(-1); searchRef.current?.focus() }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {cart.map((item, idx) => (
                <div key={`modal-${item.produtoId}-${idx}`}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all ${
                    selectedCartIdx === idx
                      ? 'bg-primary/10 border-2 border-primary ring-1 ring-primary/20'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedCartIdx(idx)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0 ${
                    selectedCartIdx === idx ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{item.nome}</p>
                    <p className="text-xs text-gray-400">
                      {item.quantidade}x {formatCurrency(item.precoUnitario)}
                    </p>
                  </div>
                  <p className="font-bold text-sm text-gray-800 flex-shrink-0">{formatCurrency(item.total)}</p>
                  {selectedCartIdx === idx && (
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteIdx(idx) }}
                      className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400 justify-center">
                <span>↑↓: Navegar</span>
                <span>+/-: Quantidade</span>
                <span>Delete: Remover</span>
                <span>Esc: Fechar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Catalogo de Produtos (F3) ====== */}
      {showProductCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-gray-800">Produtos Cadastrados</h3>
                <span className="text-xs text-gray-400 ml-1">({catalogProducts.length})</span>
              </div>
              <button onClick={() => { setShowProductCatalog(false); searchRef.current?.focus() }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="px-5 pt-3 pb-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={catalogSearchRef}
                  type="text"
                  placeholder="Filtrar produtos..."
                  value={catalogSearch}
                  onChange={e => { setCatalogSearch(e.target.value); setCatalogSelectedIdx(0) }}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
              {catalogProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {catalogSearch ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </div>
              ) : (
                catalogProducts.map((prod, idx) => (
                  <button
                    key={prod._id}
                    data-catalog-item
                    onClick={() => { handleAddProduct(prod._id); setShowProductCatalog(false) }}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                      catalogSelectedIdx === idx
                        ? 'bg-primary/10 border-2 border-primary ring-1 ring-primary/20'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                    ref={el => {
                      if (catalogSelectedIdx === idx && el) {
                        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                      }
                    }}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0 ${
                      catalogSelectedIdx === idx ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">{prod.nome}</p>
                      <p className="text-xs text-gray-400">
                        Cod: {prod.codigo} | Estoque: {prod.estoque} {prod.unidade}
                      </p>
                    </div>
                    <p className="font-bold text-sm text-primary flex-shrink-0">{formatCurrency(prod.preco)}</p>
                    <Plus size={14} className="text-gray-300 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400 justify-center">
                <span>↑↓: Navegar</span>
                <span>Enter: Adicionar ao carrinho</span>
                <span>Esc: Fechar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Caixa Fechado ====== */}
      {showCaixaModal && !caixaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">Caixa Fechado</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Nao ha caixa aberto. Para realizar vendas, abra um caixa primeiro.
            </p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/app/caixas')} className="btn-primary flex-1">Abrir Caixa</button>
              <button onClick={() => setShowCaixaModal(false)} className="btn-secondary flex-1">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Caixa Aberto (opções) ====== */}
      {showCaixaModal && caixaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
            <div className="rounded-t-2xl bg-primary/10 px-5 py-4">
              <h2 className="text-lg font-bold text-gray-800">Caixa Aberto</h2>
            </div>
            <div className="p-5">
              <p className="font-medium text-gray-700">Existe um caixa aberto.</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-500">
                <li>Caixa: #{caixaAberto.numero}</li>
                <li>Operador: {caixaAberto.operadorNome}</li>
                <li>Abertura: {formatCurrency(caixaAberto.valorAbertura)}</li>
              </ul>
              <div className="mt-5 space-y-2">
                <button onClick={() => setShowCaixaModal(false)} className="btn-primary w-full">
                  Continuar Usando Este Caixa
                </button>
                <button onClick={() => { setShowCaixaModal(false); navigate('/app/caixas') }} className="btn-secondary w-full">
                  Ir Para Tela de Caixas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Crediario - Selecionar Cliente ====== */}
      {showCrediarioClientModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Selecionar Cliente</h3>
                <p className="text-xs text-gray-500 mt-0.5">Crediario requer um cliente cadastrado</p>
              </div>
              <button onClick={() => setShowCrediarioClientModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  ref={crediarioSearchRef}
                  type="text"
                  placeholder="Buscar cliente por nome, CPF/CNPJ..."
                  value={crediarioClientSearch}
                  onChange={e => setCrediarioClientSearch(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 min-h-[150px]">
              {crediarioClientSearch.length < 2 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <User size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">Digite pelo menos 2 caracteres para buscar</p>
                </div>
              ) : crediarioClientResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <User size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">Nenhum cliente encontrado</p>
                  <button
                    onClick={() => navigate('/app/clientes/novo', { state: { returnTo: '/app/novo-pedido' } })}
                    className="mt-3 text-sm text-primary font-semibold hover:text-primary-hover transition-colors flex items-center gap-1"
                  >
                    <Plus size={16} /> Cadastrar novo cliente (F6)
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {crediarioClientResults.map((c, idx) => (
                    <button
                      key={c._id}
                      onClick={() => handleCrediarioClientSelect(c._id, c.nome)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all ${
                        idx === crediarioSelectedIdx
                          ? 'bg-primary/10 border-2 border-primary ring-1 ring-primary/20'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${
                          idx === crediarioSelectedIdx ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {c.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{c.nome}</p>
                          <p className="text-xs text-gray-400">{c.cpfCnpj || 'Sem documento'}</p>
                        </div>
                      </div>
                      {idx === crediarioSelectedIdx && (
                        <span className="text-xs text-primary font-medium">Enter</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-3">
                <button onClick={() => setShowCrediarioClientModal(false)} className="btn-secondary flex-1">
                  Cancelar (Esc)
                </button>
                <button
                  onClick={() => navigate('/app/clientes/novo', { state: { returnTo: '/app/novo-pedido' } })}
                  className="btn-primary flex-1"
                >
                  <Plus size={16} /> Novo Cliente (F6)
                </button>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400 justify-center mt-2">
                <span>↑↓: Navegar</span>
                <span>Enter: Selecionar</span>
                <span>F6: Novo cliente</span>
                <span>Esc: Cancelar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Pagamento ====== */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">Pagamento</h3>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Total */}
              <div className="bg-primary/5 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">Total da Venda</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalVenda)}</p>
              </div>

              {/* Payment method selector */}
              <div>
                <p className={`text-sm font-medium mb-2 ${paymentPhase === 'method' ? 'text-primary font-bold' : 'text-gray-700'}`}>
                  Forma de Pagamento {paymentPhase === 'method' && <span className="text-xs font-normal ml-1">(←→ navegar, Enter confirmar)</span>}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {formasPagamento.map((f) => (
                    <button key={f.key} onClick={() => { handleSelectFormaPagamento(f.key); setPaymentPhase('value'); setTimeout(() => valorPagamentoRef.current?.focus(), 50) }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-medium relative ${
                        formaPagamento === f.key
                          ? paymentPhase === 'method'
                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/40 shadow-md'
                            : 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      <span className="absolute top-1 right-1.5 text-[10px] text-gray-400 font-mono">{f.shortcut}</span>
                      <f.icon size={20} />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Valor</label>
                  <input ref={valorPagamentoRef} type="number" step="0.01" value={valorPagamento}
                    onChange={e => setValorPagamento(e.target.value)}
                    placeholder={restante > 0 ? restante.toFixed(2) : '0.00'}
                    className="input-field"
                    onKeyDown={e => { if (e.key === 'Enter') handleAddPagamento() }}
                  />
                </div>
                {(formaPagamento === 'credito' || formaPagamento === 'crediario') && (
                  <div className="w-28">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Parcelas</label>
                    <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} className="input-field">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </div>
                )}
                <div className="flex items-end">
                  <button onClick={handleAddPagamento} className="btn-primary h-[46px]"><Plus size={18} /></button>
                </div>
              </div>

              {/* Added payments list */}
              {pagamentos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Pagamentos adicionados</p>
                  {pagamentos.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-success capitalize">{p.forma}</span>
                        {p.parcelas && p.parcelas > 1 && <span className="text-xs text-gray-500">{p.parcelas}x</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{formatCurrency(p.valor)}</span>
                        <button onClick={() => handleRemovePagamento(i)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-medium">{formatCurrency(totalVenda)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Pago</span><span className="font-medium text-green-600">{formatCurrency(totalPago)}</span></div>
                {restante > 0 && (
                  <div className="flex justify-between text-red-600"><span>Restante</span><span className="font-bold">{formatCurrency(restante)}</span></div>
                )}
                {troco > 0 && (
                  <div className="flex justify-between text-blue-600 border-t pt-1.5">
                    <span className="font-bold">Troco</span><span className="font-bold text-lg">{formatCurrency(troco)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t space-y-3">
              <div className="flex gap-3">
                <button onClick={() => { setShowPayment(false); searchRef.current?.focus() }} className="btn-secondary flex-1">
                  Voltar (Esc)
                </button>
                <button onClick={handleFinalizarVenda} className="btn-primary flex-1" disabled={pagamentos.length === 0 || totalPago < totalVenda}>
                  Finalizar (F12)
                </button>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400 justify-center">
                <span>←→/1-5: Forma pgto</span>
                <span>Enter: Confirmar forma → Valor</span>
                <span>Space: Preencher valor</span>
                <span>Enter: Adicionar pgto</span>
                <span>F10: Pgto rapido</span>
                <span>F12: Finalizar</span>
                <span>Esc: Voltar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Desconto ====== */}
      {showDesconto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Desconto</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setDescontoTipoInput('valor')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${descontoTipoInput === 'valor' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'}`}>
                  R$ Valor
                </button>
                <button onClick={() => setDescontoTipoInput('percentual')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${descontoTipoInput === 'percentual' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'}`}>
                  % Percentual
                </button>
              </div>
              <input type="number" step="0.01" value={descontoInput}
                onChange={e => setDescontoInput(e.target.value)}
                placeholder={descontoTipoInput === 'valor' ? '0.00' : '0'}
                className="input-field" autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleApplyDesconto() }}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowDesconto(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleApplyDesconto} className="btn-primary flex-1">Aplicar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Produto Não Encontrado ====== */}
      {showNotFoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">Produto Nao Encontrado</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              O codigo <strong className="font-mono">{notFoundBarcode}</strong> nao foi encontrado no estoque.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Deseja cadastrar um novo produto com este codigo de barras?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowNotFoundModal(false); setSearchTerm(''); searchRef.current?.focus() }}
                className="btn-secondary flex-1"
              >
                Cancelar (Esc)
              </button>
              <button
                onClick={() => navigate('/app/produtos/novo', { state: { codigoBarras: notFoundBarcode, returnTo: '/app/novo-pedido' } })}
                className="btn-primary flex-1"
                autoFocus
              >
                Cadastrar (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Confirmar Exclusão ====== */}
      {confirmDeleteIdx >= 0 && confirmDeleteIdx < cart.length && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Trash2 size={24} />
              <h3 className="text-lg font-bold">Remover Item</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Deseja remover <strong>{cart[confirmDeleteIdx].nome}</strong> do carrinho?
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Qtd: {cart[confirmDeleteIdx].quantidade} | Total: {formatCurrency(cart[confirmDeleteIdx].total)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteIdx(-1)}
                className="btn-secondary flex-1"
                autoFocus={false}
              >
                Cancelar (Esc)
              </button>
              <button
                onClick={() => { removeFromCart(confirmDeleteIdx); setConfirmDeleteIdx(-1) }}
                className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700"
                autoFocus
              >
                Remover (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Variação / Serial ====== */}
      {showVariacaoModal && variacaoProduto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-1">{variacaoProduto.nome}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {variacaoProduto.temVariacoes ? 'Selecione tamanho/cor:' : 'Selecione o numero de serie:'}
              </p>

              {/* Variações (roupas) */}
              {variacaoProduto.temVariacoes && variacaoProduto.variacoes && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {variacaoProduto.variacoes.filter(v => v.estoque > 0).map((v, idx) => {
                    const label = [v.tamanho, v.cor].filter(Boolean).join(' / ')
                    const precoVar = v.preco || variacaoProduto.preco
                    return (
                      <button key={v._id || idx}
                        onClick={() => setVariacaoSelecionada(v._id || `${idx}`)}
                        className={`w-full flex items-center justify-between rounded-xl border-2 p-3 transition-all ${
                          variacaoSelecionada === (v._id || `${idx}`)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <div className="text-left">
                          <span className="font-medium text-gray-800">{label}</span>
                          <span className="text-xs text-gray-400 ml-2">Estoque: {v.estoque}</span>
                        </div>
                        <span className="font-semibold text-gray-700">
                          {formatCurrency(precoVar)}
                        </span>
                      </button>
                    )
                  })}
                  {variacaoProduto.variacoes.filter(v => v.estoque > 0).length === 0 && (
                    <p className="text-sm text-red-500 text-center py-4">Nenhuma variacao com estoque disponivel.</p>
                  )}
                </div>
              )}

              {/* Seriais (informática) */}
              {variacaoProduto.temSerial && variacaoProduto.seriais && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {variacaoProduto.seriais.filter(s => s.status === 'disponivel').map((s, idx) => (
                    <button key={s._id || idx}
                      onClick={() => setSerialSelecionado(s.numero)}
                      className={`w-full flex items-center justify-between rounded-xl border-2 p-3 transition-all ${
                        serialSelecionado === s.numero
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <span className="font-mono text-sm text-gray-800">{s.numero}</span>
                      <span className="text-xs text-green-600 font-medium">Disponivel</span>
                    </button>
                  ))}
                  {variacaoProduto.seriais.filter(s => s.status === 'disponivel').length === 0 && (
                    <p className="text-sm text-red-500 text-center py-4">Nenhum serial disponivel.</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => { setShowVariacaoModal(false); setVariacaoProduto(null); searchRef.current?.focus() }}
                  className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (variacaoProduto.temVariacoes && variacaoProduto.variacoes) {
                      const selIdx = variacaoProduto.variacoes.findIndex((v, i) => (v._id || `${i}`) === variacaoSelecionada)
                      if (selIdx < 0) { return }
                      const v = variacaoProduto.variacoes[selIdx]
                      const garantiaAte = variacaoProduto.garantiaMeses
                        ? new Date(Date.now() + variacaoProduto.garantiaMeses * 30 * 86400000).toISOString()
                        : undefined
                      addToCartComVariacao(variacaoProduto._id, {
                        variacaoId: v._id,
                        tamanho: v.tamanho,
                        cor: v.cor,
                        preco: v.preco || variacaoProduto.preco,
                        garantiaAte,
                      })
                    } else if (variacaoProduto.temSerial && serialSelecionado) {
                      const garantiaAte = variacaoProduto.garantiaMeses
                        ? new Date(Date.now() + variacaoProduto.garantiaMeses * 30 * 86400000).toISOString()
                        : undefined
                      addToCartComVariacao(variacaoProduto._id, {
                        serialNumero: serialSelecionado,
                        garantiaAte,
                      })
                    }
                    setShowVariacaoModal(false)
                    setVariacaoProduto(null)
                    searchRef.current?.focus()
                  }}
                  disabled={
                    (variacaoProduto.temVariacoes && !variacaoSelecionada) ||
                    (variacaoProduto.temSerial && !serialSelecionado)
                  }
                  className="btn-primary flex-1"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: Recibo ====== */}
      {showRecibo && vendaFinalizada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Receipt size={28} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Venda Realizada!</h3>
                <p className="text-sm text-gray-500">Venda #{vendaFinalizada.numero}</p>
              </div>

              {/* Recibo */}
              <div className="recibo-print border border-gray-200 rounded-lg p-4 my-4">
                {user?.empresa?.logoBase64 && (
                  <div className="flex justify-center mb-2">
                    <img src={user.empresa.logoBase64} alt="Logo" className="max-h-16 max-w-[160px] object-contain" />
                  </div>
                )}
                <div className="centro bold">{user?.empresa?.nome || 'COMPROVANTE DE VENDA'}</div>
                {user?.empresa?.cnpj && <div className="centro text-[10px]">CNPJ: {user.empresa.cnpj}</div>}
                {user?.empresa?.telefone && <div className="centro text-[10px]">Tel: {user.empresa.telefone}</div>}
                <div className="linha" />
                <div>Venda #{vendaFinalizada.numero}</div>
                <div>Data: {new Date(vendaFinalizada.criadoEm).toLocaleString('pt-BR')}</div>
                <div>Cliente: {vendaFinalizada.clienteNome}</div>
                <div>Vendedor: {vendaFinalizada.vendedorNome}</div>
                <div className="linha" />
                <div className="bold">ITENS:</div>
                {vendaFinalizada.itens.map((item, i) => (
                  <div key={i}>
                    {item.nome}<br />
                    &nbsp;&nbsp;{item.quantidade}x {formatCurrency(item.precoUnitario)} = {formatCurrency(item.total)}
                  </div>
                ))}
                <div className="linha" />
                <div>Subtotal: {formatCurrency(vendaFinalizada.subtotal)}</div>
                {vendaFinalizada.desconto > 0 && <div>Desconto: -{formatCurrency(vendaFinalizada.desconto)}</div>}
                <div className="bold">TOTAL: {formatCurrency(vendaFinalizada.total)}</div>
                <div className="linha" />
                <div className="bold">PAGAMENTO:</div>
                {vendaFinalizada.pagamentos.map((p, i) => (
                  <div key={i} className="capitalize">{p.forma}: {formatCurrency(p.valor)}{p.parcelas && p.parcelas > 1 ? ` (${p.parcelas}x)` : ''}</div>
                ))}
                {vendaFinalizada.troco > 0 && <div>Troco: {formatCurrency(vendaFinalizada.troco)}</div>}
                <div className="linha" />
                <div className="centro">Obrigado pela preferencia!</div>
              </div>

              <div className="flex gap-3">
                <button onClick={imprimirReciboVenda} className="btn-secondary flex-1">
                  <Printer size={16} /> Imprimir (P)
                </button>
                <button onClick={enviarReciboWhatsApp} className="flex-1 px-4 py-3 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#1da851] transition-colors flex items-center justify-center gap-2">
                  <Smartphone size={16} /> WhatsApp
                </button>
                <button onClick={handleNovaVenda} className="btn-primary flex-1" autoFocus>
                  Nova Venda (Enter)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== FINALIZING SALE MODAL ====== */}
      {showFinalizando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[80] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full mx-4 text-center">
            <div className="w-20 h-20 mx-auto mb-5 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                <Receipt size={24} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Finalizando venda...</h2>
            <p className="text-gray-400 text-sm">Registrando pagamento e gerando recibo</p>
          </div>
        </div>
      )}

      {/* ====== CANCEL SALE MODAL ====== */}
      {showCancelVendaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Cancelar Venda?</h2>
            <p className="text-gray-500 mb-6">
              Tem certeza que deseja cancelar esta venda? Todos os {cart.length} {cart.length === 1 ? 'item será removido' : 'itens serão removidos'} do carrinho.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelVendaModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Voltar <span className="text-xs text-gray-400 ml-1">(ESC)</span>
              </button>
              <button
                onClick={() => { clearCart(); setShowCancelVendaModal(false); toast.sucesso('Venda cancelada'); searchRef.current?.focus() }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-rose-700 transition-all shadow-lg"
                autoFocus
              >
                Cancelar Venda <span className="text-xs text-red-200 ml-1">(ENTER)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== NAVIGATION GUARD MODAL ====== */}
      {showNavGuardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Venda em andamento!</h2>
            <p className="text-gray-500 mb-6">
              Você tem {cart.length} {cart.length === 1 ? 'item' : 'itens'} no carrinho. Sair desta página irá descartar a venda atual.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowNavGuardModal(false); setPendingNavPath(null) }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Continuar Venda <span className="text-xs text-gray-400 ml-1">(ESC)</span>
              </button>
              <button
                onClick={() => { setShowNavGuardModal(false); if (pendingNavPath) { navigate(pendingNavPath); setPendingNavPath(null) } }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg"
              >
                Sair da Página <span className="text-xs text-orange-200 ml-1">(ENTER)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== REFRESH GUARD MODAL ====== */}
      {showRefreshGuardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Atualizar a página?</h2>
            <p className="text-gray-500 mb-6">
              Você tem {cart.length} {cart.length === 1 ? 'item' : 'itens'} no carrinho. Atualizar a página irá descartar a venda atual.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefreshGuardModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar <span className="text-xs text-gray-400 ml-1">(ESC)</span>
              </button>
              <button
                onClick={() => { setShowRefreshGuardModal(false); window.location.reload() }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg"
              >
                Recarregar <span className="text-xs text-orange-200 ml-1">(ENTER)</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Barcode Camera Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
