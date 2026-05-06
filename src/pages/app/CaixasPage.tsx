import { useState, useMemo, useCallback } from 'react'
import { Package, PackageCheck, Plus, ArrowDownCircle, ArrowUpCircle, X, Eye, LayoutDashboard, Banknote, CreditCard, Smartphone, FileText, Receipt, Printer } from 'lucide-react'
import { useCaixa } from '../../contexts/CaixaContext'
import { useVendas } from '../../contexts/VendaContext'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDateTime } from '../../utils/helpers'
import { imprimirRecibo, deveImprimirAutomatico } from '../../utils/impressao'
import type { Caixa, FormaPagamento } from '../../types'
import { TutorialModal } from '../../components/app/TutorialModal'
import { tutorialCaixas } from '../../config/tutorials'

// Ordem e label das formas de pagamento exibidas na quebra do caixa
const FORMAS_PAGAMENTO: { key: FormaPagamento; label: string; icon: typeof Banknote; cor: string }[] = [
  { key: 'dinheiro',  label: 'Dinheiro',      icon: Banknote,   cor: 'text-emerald-600' },
  { key: 'credito',   label: 'Cartao Credito', icon: CreditCard, cor: 'text-blue-600' },
  { key: 'debito',    label: 'Cartao Debito',  icon: CreditCard, cor: 'text-indigo-600' },
  { key: 'pix',       label: 'PIX',            icon: Smartphone, cor: 'text-teal-600' },
  { key: 'crediario', label: 'Crediario',      icon: FileText,   cor: 'text-amber-600' },
  { key: 'boleto',    label: 'Boleto',         icon: Receipt,    cor: 'text-purple-600' },
]

function totalDoBreakdown(b: Record<FormaPagamento, number>) {
  return (Object.values(b) as number[]).reduce((s, v) => s + v, 0)
}

export function CaixasPage() {
  const { caixas, caixaAberto, abrirCaixa, fecharCaixa, registrarMovimentacao } = useCaixa()
  const { vendas } = useVendas()
  const { user } = useAuth()

  // Agrega vendas finalizadas de um caixa por forma de pagamento.
  // Cada Venda tem `pagamentos: Pagamento[]` (uma venda pode ter mais de uma forma).
  const breakdownPorCaixa = useMemo(() => {
    const mapa = new Map<string, Record<FormaPagamento, number>>()
    for (const v of vendas) {
      if (v.status !== 'finalizada' || !v.caixaId) continue
      const atual = mapa.get(v.caixaId) || {
        dinheiro: 0, credito: 0, debito: 0, pix: 0, boleto: 0, crediario: 0,
      }
      for (const p of v.pagamentos || []) {
        atual[p.forma] = (atual[p.forma] || 0) + p.valor
      }
      mapa.set(v.caixaId, atual)
    }
    return mapa
  }, [vendas])

  const getBreakdown = (caixaId: string): Record<FormaPagamento, number> =>
    breakdownPorCaixa.get(caixaId) || {
      dinheiro: 0, credito: 0, debito: 0, pix: 0, boleto: 0, crediario: 0,
    }

  const [aba, setAba] = useState<'abertos' | 'fechados'>('abertos')
  const [showAbrirModal, setShowAbrirModal] = useState(false)
  const [showFecharModal, setShowFecharModal] = useState(false)
  const [showMovModal, setShowMovModal] = useState<'reforco' | 'sangria' | null>(null)
  const [showDetalhe, setShowDetalhe] = useState<Caixa | null>(null)

  const [valorAbertura, setValorAbertura] = useState('0')
  const [valorMov, setValorMov] = useState('')
  const [descricaoMov, setDescricaoMov] = useState('')
  const [obsFechar, setObsFechar] = useState('')

  // Conferencia cega: contagem por forma e passo do modal de fechar (1 = conta, 2 = compara)
  const [fecharStep, setFecharStep] = useState<1 | 2>(1)
  const [contagemForma, setContagemForma] = useState<Record<FormaPagamento, string>>({
    dinheiro: '', credito: '', debito: '', pix: '', crediario: '', boleto: '',
  })

  const caixasFechados = useMemo(() =>
    caixas.filter(c => c.status === 'fechado').sort((a, b) => (b.fechadoEm || '').localeCompare(a.fechadoEm || '')),
    [caixas]
  )

  const handleAbrir = () => {
    const val = parseFloat(valorAbertura) || 0
    abrirCaixa(val)
    setShowAbrirModal(false)
    setValorAbertura('0')
  }

  // Esperado por forma de pagamento no momento do fechamento
  const esperadoPorForma = useMemo(() => {
    if (!caixaAberto) return null
    const b = getBreakdown(caixaAberto._id)
    // Dinheiro fisico = vendas em dinheiro + abertura + reforcos - sangrias
    // Outras formas = somente as vendas naquela forma (cartao/PIX ficam na maquina/banco)
    return {
      dinheiro: b.dinheiro + caixaAberto.valorAbertura + caixaAberto.totalEntradas - caixaAberto.totalSaidas,
      credito: b.credito,
      debito: b.debito,
      pix: b.pix,
      crediario: b.crediario,
      boleto: b.boleto,
    } as Record<FormaPagamento, number>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caixaAberto, breakdownPorCaixa])

  const totalEsperado = esperadoPorForma
    ? (Object.values(esperadoPorForma) as number[]).reduce((s, v) => s + v, 0)
    : 0

  const totalContado = (Object.values(contagemForma) as string[])
    .reduce((s, v) => s + (parseFloat(v) || 0), 0)

  const diferencaTotal = totalContado - totalEsperado

  const resetFecharModal = () => {
    setShowFecharModal(false)
    setObsFechar('')
    setFecharStep(1)
    setContagemForma({ dinheiro: '', credito: '', debito: '', pix: '', crediario: '', boleto: '' })
  }

  // Gera HTML do comprovante de fechamento (formato cupom termico 80mm).
  // Aceita o Caixa ja persistido OU um snapshot construido localmente
  // logo apos o fechamento (antes do reload do contexto).
  const gerarComprovanteFechamentoHtml = useCallback((c: Caixa): string => {
    const empresa = user?.empresa?.nome || 'MeuPDV'
    const cnpj = user?.empresa?.cnpj ? `<div class="centro">CNPJ: ${user.empresa.cnpj}</div>` : ''
    const tel = user?.empresa?.telefone ? `<div class="centro">Tel: ${user.empresa.telefone}</div>` : ''

    const breakdown = getBreakdown(c._id)
    const totalVendasForma = totalDoBreakdown(breakdown)

    const linhasFormas = FORMAS_PAGAMENTO.map(f => {
      const v = breakdown[f.key] || 0
      if (v === 0) return ''
      return `<div>${f.label.padEnd(18, ' ')} ${formatCurrency(v)}</div>`
    }).filter(Boolean).join('')

    const conferenciaHtml = typeof c.valorContado === 'number'
      ? `
        <div class="linha"></div>
        <div class="bold">CONFERENCIA:</div>
        <div>Esperado: ${formatCurrency(c.valorEsperado ?? c.valorFechamento ?? 0)}</div>
        <div>Contado:  ${formatCurrency(c.valorContado)}</div>
        <div class="bold">Diferenca: ${(c.diferenca ?? 0) > 0 ? '+' : ''}${formatCurrency(c.diferenca ?? 0)}</div>
        ${(c.contagemPorForma && c.contagemPorForma.length > 0) ? `
          <div class="linha"></div>
          <div class="bold">CONTAGEM POR FORMA:</div>
          ${c.contagemPorForma.map(cf => {
            const f = FORMAS_PAGAMENTO.find(x => x.key === cf.forma)
            const label = f?.label || cf.forma
            return `<div>${label.padEnd(18, ' ')} ${formatCurrency(cf.valor)}</div>`
          }).join('')}
        ` : ''}
      `
      : ''

    const movimentacoesHtml = c.movimentacoes && c.movimentacoes.length > 0
      ? `
        <div class="linha"></div>
        <div class="bold">MOVIMENTACOES (${c.movimentacoes.length}):</div>
        ${c.movimentacoes.map(m => {
          const sinal = m.tipo === 'sangria' ? '-' : '+'
          const tipo = m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)
          return `<div>${tipo}: ${sinal}${formatCurrency(m.valor)}<br>&nbsp;&nbsp;${m.descricao}</div>`
        }).join('')}
      `
      : ''

    const observacoesHtml = c.observacoes
      ? `<div class="linha"></div><div class="bold">OBS:</div><div>${c.observacoes}</div>`
      : ''

    const diffWarning = (c.diferenca && Math.abs(c.diferenca) >= 0.01)
      ? `
        <div class="linha"></div>
        <div class="centro">_______________________</div>
        <div class="centro">Assinatura Gerente</div>
      `
      : ''

    return `
      <div class="centro bold">${empresa}</div>
      ${cnpj}
      ${tel}
      <div class="linha"></div>
      <div class="centro bold">COMPROVANTE DE FECHAMENTO DE CAIXA</div>
      <div class="linha"></div>
      <div>Caixa #${c.numero}</div>
      <div>Operador: ${c.operadorNome}</div>
      <div>Aberto:   ${formatDateTime(c.abertoEm)}</div>
      <div>Fechado:  ${formatDateTime(c.fechadoEm || '')}</div>
      <div class="linha"></div>
      <div>Abertura:  ${formatCurrency(c.valorAbertura)}</div>
      <div>Vendas:    +${formatCurrency(c.totalVendas)}</div>
      <div>Reforcos:  +${formatCurrency(c.totalEntradas)}</div>
      <div>Sangrias:  -${formatCurrency(c.totalSaidas)}</div>
      <div class="bold">Saldo Esperado: ${formatCurrency(c.valorFechamento || 0)}</div>
      ${totalVendasForma > 0 ? `
        <div class="linha"></div>
        <div class="bold">VENDAS POR FORMA:</div>
        ${linhasFormas}
        <div>${'Subtotal'.padEnd(18, ' ')} ${formatCurrency(totalVendasForma)}</div>
      ` : ''}
      ${conferenciaHtml}
      ${movimentacoesHtml}
      ${observacoesHtml}
      <div class="linha"></div>
      <div class="centro">_______________________</div>
      <div class="centro">Assinatura ${c.operadorNome}</div>
      ${diffWarning}
    `
  }, [user, breakdownPorCaixa])  // eslint-disable-line react-hooks/exhaustive-deps

  const imprimirComprovante = useCallback((c: Caixa) => {
    const html = gerarComprovanteFechamentoHtml(c)
    imprimirRecibo(html, undefined, user?.empresa?.logoBase64)
  }, [gerarComprovanteFechamentoHtml, user])

  const handleFechar = () => {
    if (!caixaAberto) return
    // Monta a lista de formas que o operador realmente conferiu (preencheu valor)
    const contagemPorForma = (Object.entries(contagemForma) as [FormaPagamento, string][])
      .filter(([, v]) => v !== '' && !isNaN(parseFloat(v)))
      .map(([forma, v]) => ({ forma, valor: parseFloat(v) }))

    // Snapshot do caixa fechado para imprimir antes do reload do contexto
    const snapshot: Caixa = {
      ...caixaAberto,
      status: 'fechado',
      fechadoEm: new Date().toISOString(),
      valorFechamento: totalEsperado,
      valorEsperado: totalEsperado,
      valorContado: totalContado,
      diferenca: diferencaTotal,
      contagemPorForma: contagemPorForma.length > 0 ? contagemPorForma : undefined,
      observacoes: obsFechar.trim() || caixaAberto.observacoes,
    }

    fecharCaixa(
      caixaAberto._id,
      obsFechar.trim() || undefined,
      {
        valorContado: totalContado,
        contagemPorForma: contagemPorForma.length > 0 ? contagemPorForma : undefined,
      },
    )

    // Auto-impressao do comprovante se a impressora estiver configurada para isso
    if (deveImprimirAutomatico()) {
      setTimeout(() => imprimirComprovante(snapshot), 500)
    }

    resetFecharModal()
  }

  const handleMov = () => {
    if (!caixaAberto || !showMovModal || !valorMov) return
    const val = parseFloat(valorMov) || 0
    if (val <= 0) return
    registrarMovimentacao(caixaAberto._id, {
      tipo: showMovModal,
      valor: val,
      descricao: descricaoMov.trim() || (showMovModal === 'reforco' ? 'Reforco de caixa' : 'Sangria de caixa'),
    })
    setShowMovModal(null)
    setValorMov('')
    setDescricaoMov('')
  }

  const saldoAtual = caixaAberto ? caixaAberto.totalEntradas - caixaAberto.totalSaidas : 0

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Caixas</h1>
            <p className="text-sm text-gray-500">
              {caixaAberto ? `Caixa #${caixaAberto.numero} aberto` : 'Nenhum caixa aberto'}
            </p>
          </div>
          {!caixaAberto && (
            <button onClick={() => setShowAbrirModal(true)} className="btn-primary">
              <Plus size={18} /> Abrir Caixa
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button onClick={() => setAba('abertos')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              aba === 'abertos' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <Package size={16} /> Caixa Aberto
          </button>
          <button onClick={() => setAba('fechados')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              aba === 'fechados' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <PackageCheck size={16} /> Historico ({caixasFechados.length})
          </button>
        </div>

        {/* Tab: Caixa Aberto */}
        {aba === 'abertos' && (
          <>
            {caixaAberto ? (
              <div className="space-y-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="card p-4">
                    <p className="text-xs text-gray-500">Abertura</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(caixaAberto.valorAbertura)}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs text-gray-500">Total Vendas</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(caixaAberto.totalVendas)}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs text-gray-500">Entradas</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(caixaAberto.totalEntradas)}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs text-gray-500">Saidas</p>
                    <p className="text-lg font-bold text-red-500">{formatCurrency(caixaAberto.totalSaidas)}</p>
                  </div>
                </div>

                {/* Saldo */}
                <div className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Saldo Atual do Caixa</p>
                    <p className="text-xs text-gray-400">Caixa #{caixaAberto.numero} - Aberto em {formatDateTime(caixaAberto.abertoEm)}</p>
                    <p className="text-xs text-gray-400">Operador: {caixaAberto.operadorNome}</p>
                  </div>
                  <p className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(saldoAtual)}
                  </p>
                </div>

                {/* Vendas por forma de pagamento */}
                <div className="card">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-semibold text-gray-700">Vendas por forma de pagamento</p>
                    <p className="text-xs text-gray-400">Util na hora de conferir o caixa</p>
                  </div>
                  {(() => {
                    const b = getBreakdown(caixaAberto._id)
                    const total = totalDoBreakdown(b)
                    if (total === 0) {
                      return <p className="p-4 text-sm text-gray-400 text-center">Nenhuma venda registrada ainda</p>
                    }
                    return (
                      <div className="divide-y divide-gray-100">
                        {FORMAS_PAGAMENTO.map(f => {
                          const valor = b[f.key] || 0
                          if (valor === 0) return null
                          const Icon = f.icon
                          return (
                            <div key={f.key} className="flex items-center gap-3 px-4 py-2.5">
                              <Icon size={16} className={f.cor} />
                              <span className="text-sm text-gray-700 flex-1">{f.label}</span>
                              <span className="text-sm font-semibold text-gray-800">{formatCurrency(valor)}</span>
                            </div>
                          )
                        })}
                        <div className="flex items-center px-4 py-2.5 bg-gray-50">
                          <span className="text-sm font-semibold text-gray-700 flex-1">Total de vendas</span>
                          <span className="text-sm font-bold text-gray-800">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowMovModal('reforco')} className="btn-primary">
                    <ArrowDownCircle size={16} /> Reforco
                  </button>
                  <button onClick={() => setShowMovModal('sangria')} className="btn-secondary">
                    <ArrowUpCircle size={16} /> Sangria
                  </button>
                  <button onClick={() => setShowFecharModal(true)} className="btn-danger ml-auto">
                    <PackageCheck size={16} /> Fechar Caixa
                  </button>
                </div>

                {/* Movimentacoes */}
                <div className="card">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-semibold text-gray-700">Movimentacoes ({caixaAberto.movimentacoes.length})</p>
                  </div>
                  {caixaAberto.movimentacoes.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400 text-center">Nenhuma movimentacao</p>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                      {[...caixaAberto.movimentacoes].reverse().map(m => (
                        <div key={m._id} className="flex items-center gap-3 px-4 py-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            m.tipo === 'venda' ? 'bg-green-100 text-green-600' :
                            m.tipo === 'reforco' ? 'bg-blue-100 text-blue-600' :
                            m.tipo === 'sangria' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {m.tipo === 'venda' ? <LayoutDashboard size={14} /> :
                             m.tipo === 'reforco' ? <ArrowDownCircle size={14} /> :
                             <ArrowUpCircle size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{m.descricao}</p>
                            <p className="text-xs text-gray-400">{formatDateTime(m.criadoEm)}</p>
                          </div>
                          <p className={`text-sm font-bold flex-shrink-0 ${
                            m.tipo === 'sangria' ? 'text-red-500' : 'text-green-600'
                          }`}>
                            {m.tipo === 'sangria' ? '-' : '+'}{formatCurrency(m.valor)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center py-16">
                <Package size={48} className="text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Nenhum caixa aberto</p>
                <p className="text-sm text-gray-400 mt-1">Abra um caixa para comecar a vender</p>
                <button onClick={() => setShowAbrirModal(true)} className="btn-primary mt-4">
                  <Plus size={16} /> Abrir Caixa
                </button>
              </div>
            )}
          </>
        )}

        {/* Tab: Caixas Fechados */}
        {aba === 'fechados' && (
          <>
            {caixasFechados.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-16">
                <PackageCheck size={48} className="text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Nenhum caixa fechado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {caixasFechados.map(c => (
                  <div key={c._id} className="card p-4 flex items-center gap-4 cursor-pointer hover:border-primary/20 transition-colors"
                    onClick={() => setShowDetalhe(c)}>
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">#{c.numero}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800">Caixa #{c.numero}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                        <span>Aberto: {formatDateTime(c.abertoEm)}</span>
                        <span>Fechado: {formatDateTime(c.fechadoEm || '')}</span>
                        <span>Operador: {c.operadorNome}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">Saldo Final</p>
                      <p className="text-sm font-bold text-gray-800">{formatCurrency(c.valorFechamento || 0)}</p>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                      onClick={e => { e.stopPropagation(); setShowDetalhe(c) }}>
                      <Eye size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Abrir Caixa */}
      {showAbrirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Abrir Caixa</h3>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Valor de Abertura (troco inicial)</label>
              <input type="number" step="0.01" value={valorAbertura} onChange={e => setValorAbertura(e.target.value)}
                placeholder="0.00" className="input-field" autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAbrirModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleAbrir} className="btn-primary flex-1">Abrir Caixa</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Fechar Caixa - fluxo 2 passos (conferencia cega) */}
      {showFecharModal && caixaAberto && esperadoPorForma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800">Fechar Caixa #{caixaAberto.numero}</h3>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Passo {fecharStep}/2</span>
            </div>

            {/* PASSO 1: Conferencia cega - operador conta sem ver o esperado */}
            {fecharStep === 1 && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800 font-medium mb-1">Conferencia cega</p>
                  <p className="text-xs text-blue-700">
                    Conte fisicamente o que voce tem em cada forma de pagamento. So depois o sistema mostra o esperado e a diferenca.
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  {FORMAS_PAGAMENTO.map(f => {
                    const Icon = f.icon
                    return (
                      <div key={f.key} className="flex items-center gap-2">
                        <Icon size={16} className={f.cor} />
                        <label className="text-sm text-gray-700 flex-1">{f.label}</label>
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={contagemForma[f.key]}
                          onChange={e => setContagemForma(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder="0,00"
                          className="input-field w-32 text-right"
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Total contado</span>
                  <span className="text-lg font-bold text-gray-800">{formatCurrency(totalContado)}</span>
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  Deixe em branco a forma que voce nao conferiu — ela sera ignorada na contagem.
                </p>

                <div className="flex gap-3">
                  <button onClick={resetFecharModal} className="btn-secondary flex-1">Cancelar</button>
                  <button onClick={() => setFecharStep(2)} className="btn-primary flex-1">Conferir</button>
                </div>
              </>
            )}

            {/* PASSO 2: Comparacao - mostra esperado vs contado vs diferenca */}
            {fecharStep === 2 && (
              <>
                <div className={`rounded-lg p-3 mb-4 border ${
                  Math.abs(diferencaTotal) < 0.01 ? 'bg-green-50 border-green-200' :
                  diferencaTotal > 0 ? 'bg-blue-50 border-blue-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-sm font-bold ${
                    Math.abs(diferencaTotal) < 0.01 ? 'text-green-700' :
                    diferencaTotal > 0 ? 'text-blue-700' :
                    'text-red-700'
                  }`}>
                    {Math.abs(diferencaTotal) < 0.01 ? 'Caixa bateu certinho' :
                     diferencaTotal > 0 ? `Sobra de ${formatCurrency(diferencaTotal)}` :
                     `Falta de ${formatCurrency(Math.abs(diferencaTotal))}`}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 overflow-hidden mb-4">
                  <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="col-span-4">Forma</div>
                    <div className="col-span-3 text-right">Esperado</div>
                    <div className="col-span-3 text-right">Contado</div>
                    <div className="col-span-2 text-right">Diff</div>
                  </div>
                  {FORMAS_PAGAMENTO.map(f => {
                    const esp = esperadoPorForma[f.key] || 0
                    const cont = parseFloat(contagemForma[f.key]) || 0
                    const naoConferiu = contagemForma[f.key] === ''
                    const diff = naoConferiu ? 0 : cont - esp
                    if (esp === 0 && naoConferiu) return null
                    const Icon = f.icon
                    return (
                      <div key={f.key} className="grid grid-cols-12 gap-1 px-3 py-2 text-sm border-t border-gray-100 items-center">
                        <div className="col-span-4 flex items-center gap-1.5 truncate">
                          <Icon size={14} className={f.cor} />
                          <span className="text-gray-700 truncate">{f.label}</span>
                        </div>
                        <div className="col-span-3 text-right text-gray-700">{formatCurrency(esp)}</div>
                        <div className="col-span-3 text-right text-gray-700">
                          {naoConferiu ? <span className="text-gray-400 italic">--</span> : formatCurrency(cont)}
                        </div>
                        <div className={`col-span-2 text-right text-xs font-semibold ${
                          naoConferiu ? 'text-gray-400' :
                          Math.abs(diff) < 0.01 ? 'text-green-600' :
                          diff > 0 ? 'text-blue-600' :
                          'text-red-500'
                        }`}>
                          {naoConferiu ? '--' : (diff > 0 ? '+' : '') + formatCurrency(diff)}
                        </div>
                      </div>
                    )
                  })}
                  <div className="grid grid-cols-12 gap-1 px-3 py-2 text-sm font-bold bg-gray-50 border-t border-gray-200">
                    <div className="col-span-4 text-gray-800">Total</div>
                    <div className="col-span-3 text-right text-gray-800">{formatCurrency(totalEsperado)}</div>
                    <div className="col-span-3 text-right text-gray-800">{formatCurrency(totalContado)}</div>
                    <div className={`col-span-2 text-right text-xs ${
                      Math.abs(diferencaTotal) < 0.01 ? 'text-green-600' :
                      diferencaTotal > 0 ? 'text-blue-600' :
                      'text-red-500'
                    }`}>{(diferencaTotal > 0 ? '+' : '') + formatCurrency(diferencaTotal)}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Observacoes (opcional)</label>
                  <textarea value={obsFechar} onChange={e => setObsFechar(e.target.value)}
                    placeholder={Math.abs(diferencaTotal) >= 0.01 ? 'Justifique a diferenca, se possivel...' : 'Observacoes do fechamento...'}
                    rows={2} className="input-field resize-none" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setFecharStep(1)} className="btn-secondary flex-1">Voltar</button>
                  <button onClick={handleFechar} className="btn-danger flex-1">Confirmar Fechamento</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Reforco / Sangria */}
      {showMovModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {showMovModal === 'reforco' ? 'Reforco de Caixa' : 'Sangria de Caixa'}
            </h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Valor *</label>
                <input type="number" step="0.01" value={valorMov} onChange={e => setValorMov(e.target.value)}
                  placeholder="0.00" className="input-field" autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Descricao</label>
                <input type="text" value={descricaoMov} onChange={e => setDescricaoMov(e.target.value)}
                  placeholder={showMovModal === 'reforco' ? 'Ex: Troco adicional' : 'Ex: Pagamento fornecedor'}
                  className="input-field" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowMovModal(null); setValorMov(''); setDescricaoMov('') }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleMov} disabled={!valorMov || parseFloat(valorMov) <= 0} className="btn-primary flex-1">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhe do Caixa Fechado */}
      {showDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowDetalhe(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">Caixa #{showDetalhe.numero}</h3>
              <button onClick={() => setShowDetalhe(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Operador:</span><p className="font-medium">{showDetalhe.operadorNome}</p></div>
                <div><span className="text-gray-500">Aberto em:</span><p className="font-medium">{formatDateTime(showDetalhe.abertoEm)}</p></div>
                <div><span className="text-gray-500">Fechado em:</span><p className="font-medium">{formatDateTime(showDetalhe.fechadoEm || '')}</p></div>
                <div><span className="text-gray-500">Abertura:</span><p className="font-medium">{formatCurrency(showDetalhe.valorAbertura)}</p></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Vendas</span><span className="font-medium">{formatCurrency(showDetalhe.totalVendas)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Entradas</span><span className="text-green-600 font-medium">{formatCurrency(showDetalhe.totalEntradas)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Saidas</span><span className="text-red-500 font-medium">{formatCurrency(showDetalhe.totalSaidas)}</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>Saldo Esperado</span><span>{formatCurrency(showDetalhe.valorFechamento || 0)}</span></div>
                {typeof showDetalhe.valorContado === 'number' && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Valor Contado</span><span className="font-medium">{formatCurrency(showDetalhe.valorContado)}</span></div>
                    <div className={`flex justify-between font-bold ${
                      Math.abs(showDetalhe.diferenca || 0) < 0.01 ? 'text-green-600' :
                      (showDetalhe.diferenca || 0) > 0 ? 'text-blue-600' :
                      'text-red-500'
                    }`}>
                      <span>Diferenca</span>
                      <span>{((showDetalhe.diferenca || 0) > 0 ? '+' : '') + formatCurrency(showDetalhe.diferenca || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Detalhamento da conferencia por forma */}
              {showDetalhe.contagemPorForma && showDetalhe.contagemPorForma.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Conferencia por forma</p>
                  <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                    {showDetalhe.contagemPorForma.map(c => {
                      const f = FORMAS_PAGAMENTO.find(x => x.key === c.forma)
                      const Icon = f?.icon || Banknote
                      return (
                        <div key={c.forma} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <Icon size={14} className={f?.cor || 'text-gray-500'} />
                          <span className="text-gray-700 flex-1">{f?.label || c.forma}</span>
                          <span className="font-medium text-gray-800">{formatCurrency(c.valor)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Vendas por forma de pagamento */}
              {(() => {
                const b = getBreakdown(showDetalhe._id)
                const total = totalDoBreakdown(b)
                if (total === 0) return null
                return (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Vendas por forma de pagamento</p>
                    <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                      {FORMAS_PAGAMENTO.map(f => {
                        const valor = b[f.key] || 0
                        if (valor === 0) return null
                        const Icon = f.icon
                        return (
                          <div key={f.key} className="flex items-center gap-3 px-3 py-2 text-sm">
                            <Icon size={14} className={f.cor} />
                            <span className="text-gray-700 flex-1">{f.label}</span>
                            <span className="font-medium text-gray-800">{formatCurrency(valor)}</span>
                          </div>
                        )
                      })}
                      <div className="flex items-center px-3 py-2 text-sm bg-gray-100">
                        <span className="font-semibold text-gray-700 flex-1">Total</span>
                        <span className="font-bold text-gray-800">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                )
              })()}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Movimentacoes ({showDetalhe.movimentacoes.length})</p>
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                  {showDetalhe.movimentacoes.map(m => (
                    <div key={m._id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{m.descricao}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(m.criadoEm)}</p>
                      </div>
                      <p className={`font-semibold ${m.tipo === 'sangria' ? 'text-red-500' : 'text-green-600'}`}>
                        {m.tipo === 'sangria' ? '-' : '+'}{formatCurrency(m.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {showDetalhe.observacoes && (
                <div className="text-sm text-gray-500"><span className="font-medium">Obs:</span> {showDetalhe.observacoes}</div>
              )}

              {/* Botao: Imprimir comprovante */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => imprimirComprovante(showDetalhe)}
                  className="btn-secondary"
                  title="Imprimir comprovante de fechamento"
                >
                  <Printer size={16} /> Imprimir comprovante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <TutorialModal id="caixas" titulo="Controle de Caixa" subtitulo="Abra, gerencie e feche seus caixas" steps={tutorialCaixas} />
    </div>
  )
}
