import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Minus, Trash2, User,
  CreditCard, Banknote, Smartphone, FileText, Printer,
  X, AlertCircle, Receipt, DollarSign, Percent, Package,
} from 'lucide-react'
import { useVendas } from '../../contexts/VendaContext'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useClientes } from '../../contexts/ClienteContext'
import { useCaixa } from '../../contexts/CaixaContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../utils/helpers'
import type { Pagamento, FormaPagamento, Venda } from '../../types'

export function NovoPedidoPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const {
    cart, addToCart, removeFromCart, updateCartItem, clearCart,
    subtotal, totalDesconto, totalVenda,
    setClienteVenda, clienteNome,
    setDesconto, finalizarVenda, setObservacoesVenda, observacoes,
  } = useVendas()
  const { buscarProdutos } = useProdutos()
  const { buscarClientes } = useClientes()
  const { caixaAberto } = useCaixa()

  // Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<ReturnType<typeof buscarProdutos>>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Client search
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<ReturnType<typeof buscarClientes>>([])
  const [showClientResults, setShowClientResults] = useState(false)

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

  // Caixa warning
  const [showCaixaModal, setShowCaixaModal] = useState(false)

  useEffect(() => {
    if (!caixaAberto) setShowCaixaModal(true)
  }, [caixaAberto])

  // Product search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      setSearchResults(buscarProdutos(searchTerm))
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchTerm, buscarProdutos])

  // Client search
  useEffect(() => {
    if (clientSearch.length >= 2) {
      setClientResults(buscarClientes(clientSearch))
      setShowClientResults(true)
    } else {
      setClientResults([])
      setShowClientResults(false)
    }
  }, [clientSearch, buscarClientes])

  const handleAddProduct = useCallback((produtoId: string) => {
    addToCart(produtoId)
    setSearchTerm('')
    setShowResults(false)
    searchRef.current?.focus()
  }, [addToCart])

  const handleSelectClient = useCallback((id: string, nome: string) => {
    setClienteVenda(id, nome)
    setClientSearch('')
    setShowClientResults(false)
  }, [setClienteVenda])

  const handleApplyDesconto = () => {
    const val = parseFloat(descontoInput) || 0
    setDesconto(val, descontoTipoInput)
    setShowDesconto(false)
  }

  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0)
  const restante = totalVenda - totalPago
  const troco = totalPago > totalVenda ? totalPago - totalVenda : 0

  const handleAddPagamento = () => {
    const valor = parseFloat(valorPagamento) || (restante > 0 ? restante : 0)
    if (valor <= 0) return
    setPagamentos(prev => [...prev, {
      forma: formaPagamento,
      valor,
      parcelas: formaPagamento === 'credito' ? parcelas : undefined,
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
    if (totalPago < totalVenda) {
      toast.erro('Valor dos pagamentos insuficiente')
      return
    }
    const venda = await finalizarVenda(pagamentos)
    if (venda) {
      setVendaFinalizada(venda)
      setShowRecibo(true)
      setShowPayment(false)
      setPagamentos([])
    }
  }

  const handleNovaVenda = () => {
    setVendaFinalizada(null)
    setShowRecibo(false)
    clearCart()
    searchRef.current?.focus()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'F9') { e.preventDefault(); if (cart.length > 0) setShowPayment(true) }
      if (e.key === 'Escape') { setShowPayment(false); setShowDesconto(false); setShowRecibo(false); setShowResults(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cart.length])

  const formasPagamento: { key: FormaPagamento; label: string; icon: typeof Banknote }[] = [
    { key: 'dinheiro', label: 'Dinheiro', icon: Banknote },
    { key: 'credito', label: 'Credito', icon: CreditCard },
    { key: 'debito', label: 'Debito', icon: CreditCard },
    { key: 'pix', label: 'PIX', icon: Smartphone },
    { key: 'crediario', label: 'Crediario', icon: FileText },
  ]

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
                type="text"
                placeholder="Buscar cliente (opcional)..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowClientResults(false), 200)}
                className="flex-1 text-sm border-0 border-b border-gray-200 py-1.5 focus:border-primary focus:ring-0 bg-transparent"
              />
            )}
          </div>
          {showClientResults && clientResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto animate-scale-in">
              {clientResults.map(c => (
                <button key={c._id} onClick={() => handleSelectClient(c._id, c.nome)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b last:border-0 flex items-center justify-between">
                  <span className="font-medium">{c.nome}</span>
                  <span className="text-xs text-gray-400">{c.cpfCnpj}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar produto por nome, codigo ou codigo de barras... (F2)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            onFocus={() => { if (searchTerm.length >= 2) setShowResults(true) }}
            className="input-field pl-10"
            autoFocus
          />
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto animate-scale-in">
              {searchResults.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">Nenhum produto encontrado</p>
              ) : (
                searchResults.map(p => (
                  <button key={p._id} onClick={() => handleAddProduct(p._id)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 flex items-center justify-between transition-colors">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{p.nome}</p>
                      <p className="text-xs text-gray-400">Cod: {p.codigo} | Estoque: {p.estoque} {p.unidade}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">{formatCurrency(p.preco)}</p>
                      <Plus size={16} className="text-primary ml-auto" />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Package size={48} className="mb-3 opacity-50" />
              <p className="text-sm font-medium">Nenhum produto adicionado</p>
              <p className="text-xs mt-1">Use a busca acima para adicionar produtos (F2)</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div key={item.produtoId}
                  className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 animate-fade-in hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{item.nome}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.precoUnitario)} / un</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateCartItem(item.produtoId, item.quantidade - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={item.quantidade}
                      onChange={e => updateCartItem(item.produtoId, parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-sm font-semibold border border-gray-200 rounded-lg py-1"
                      min={1}
                    />
                    <button onClick={() => updateCartItem(item.produtoId, item.quantidade + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-bold text-sm text-gray-800 w-24 text-right flex-shrink-0">{formatCurrency(item.total)}</p>
                  <button onClick={() => removeFromCart(item.produtoId)}
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
          <div className="flex gap-2 text-xs text-gray-400 justify-center">
            <span>F2: Buscar</span>
            <span>F9: Pagar</span>
            <span>ESC: Fechar</span>
          </div>
        </div>
      </div>

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
                <p className="text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {formasPagamento.map(f => (
                    <button key={f.key} onClick={() => setFormaPagamento(f.key)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                        formaPagamento === f.key ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
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
                  <input type="number" step="0.01" value={valorPagamento}
                    onChange={e => setValorPagamento(e.target.value)}
                    placeholder={restante > 0 ? restante.toFixed(2) : '0.00'}
                    className="input-field"
                    onKeyDown={e => { if (e.key === 'Enter') handleAddPagamento() }}
                  />
                </div>
                {formaPagamento === 'credito' && (
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
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowPayment(false)} className="btn-secondary flex-1">Voltar</button>
              <button onClick={handleFinalizarVenda} className="btn-primary flex-1" disabled={pagamentos.length === 0 || totalPago < totalVenda}>
                Finalizar Venda
              </button>
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
                <div className="centro bold">MEUPDV - COMPROVANTE</div>
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
                <button onClick={() => window.print()} className="btn-secondary flex-1">
                  <Printer size={16} /> Imprimir
                </button>
                <button onClick={handleNovaVenda} className="btn-primary flex-1">
                  Nova Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
