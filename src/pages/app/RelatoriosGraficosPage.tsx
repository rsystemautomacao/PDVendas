import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingCart, DollarSign, Box, TrendingUp, TrendingDown,
  Calendar, Filter, ChevronDown, Award, Users, CreditCard,
  Banknote, Smartphone, FileText, BarChart3, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Percent, Hash, Download,
} from 'lucide-react'
import { useVendas } from '../../contexts/VendaContext'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useClientes } from '../../contexts/ClienteContext'
import { useFinanceiro } from '../../contexts/FinanceiroContext'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency } from '../../utils/helpers'
import { exportVendasPdf, exportFinanceiroPdf, exportEstoquePdf } from '../../utils/exportPdf'

type Aba = 'vendas' | 'financeiro' | 'estoque'
type PeriodoPreset = 'hoje' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'custom'

const formaIcons: Record<string, typeof Banknote> = {
  dinheiro: Banknote, credito: CreditCard, debito: CreditCard,
  pix: Smartphone, boleto: FileText, crediario: FileText,
}
const formaColors: Record<string, string> = {
  dinheiro: 'from-emerald-500 to-green-600',
  credito: 'from-blue-500 to-indigo-600',
  debito: 'from-violet-500 to-purple-600',
  pix: 'from-teal-500 to-cyan-600',
  boleto: 'from-amber-500 to-orange-600',
  crediario: 'from-rose-500 to-pink-600',
}
const formaLabel: Record<string, string> = {
  dinheiro: 'Dinheiro', credito: 'Credito', debito: 'Debito',
  pix: 'PIX', boleto: 'Boleto', crediario: 'Crediario',
}

function getDateRange(preset: PeriodoPreset, customDe: string, customAte: string): { de: string; ate: string; label: string } {
  const hoje = new Date()
  const fmt = (d: Date) => d.toISOString().substring(0, 10)

  switch (preset) {
    case 'hoje':
      return { de: fmt(hoje), ate: fmt(hoje), label: 'Hoje' }
    case 'semana': {
      const d = new Date(hoje)
      d.setDate(d.getDate() - d.getDay())
      return { de: fmt(d), ate: fmt(hoje), label: 'Esta Semana' }
    }
    case 'mes': {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      return { de: fmt(d), ate: fmt(hoje), label: 'Este Mes' }
    }
    case 'trimestre': {
      const d = new Date(hoje)
      d.setMonth(d.getMonth() - 3)
      return { de: fmt(d), ate: fmt(hoje), label: 'Ultimos 3 Meses' }
    }
    case 'ano': {
      const d = new Date(hoje.getFullYear(), 0, 1)
      return { de: fmt(d), ate: fmt(hoje), label: 'Este Ano' }
    }
    case 'custom':
      return { de: customDe, ate: customAte, label: 'Personalizado' }
  }
}

export function RelatoriosGraficosPage() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { vendas, carregarSeNecessario: carregarVendas } = useVendas()
  useEffect(() => { carregarVendas() }, [carregarVendas])
  const { produtos } = useProdutos()
  const { clientes } = useClientes()
  const { contasPagar, contasReceber, despesas } = useFinanceiro()
  const empresaNome = user?.empresa?.nome || 'MeuPDV'

  const initialAba = (searchParams.get('aba') as Aba) || 'vendas'
  const [aba, setAba] = useState<Aba>(initialAba)
  const [periodo, setPeriodo] = useState<PeriodoPreset>('mes')
  const [showPeriodoMenu, setShowPeriodoMenu] = useState(false)
  const [customDe, setCustomDe] = useState(new Date().toISOString().substring(0, 10))
  const [customAte, setCustomAte] = useState(new Date().toISOString().substring(0, 10))

  const hoje = new Date().toISOString().substring(0, 10)
  const range = getDateRange(periodo, customDe, customAte)

  // Sales report filtered by period
  const vendasReport = useMemo(() => {
    const finalizadas = vendas.filter(v => v.status === 'finalizada')
    const noRange = finalizadas.filter(v => {
      const d = v.criadoEm.substring(0, 10)
      return d >= range.de && d <= range.ate
    })
    const totalPeriodo = noRange.reduce((s, v) => s + v.total, 0)
    const qtd = noRange.length
    const ticket = qtd > 0 ? totalPeriodo / qtd : 0

    // Payment method breakdown
    const formas: Record<string, number> = {}
    noRange.forEach(v => {
      v.pagamentos.forEach(p => {
        formas[p.forma] = (formas[p.forma] || 0) + p.valor
      })
    })

    // Top products
    const prodMap: Record<string, { nome: string; qtd: number; total: number }> = {}
    noRange.forEach(v => {
      v.itens.forEach(item => {
        if (!prodMap[item.produtoId]) prodMap[item.produtoId] = { nome: item.nome, qtd: 0, total: 0 }
        prodMap[item.produtoId].qtd += item.quantidade
        prodMap[item.produtoId].total += item.total
      })
    })
    const topProdutos = Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 10)

    // Top clients
    const clientMap: Record<string, { nome: string; total: number; qtd: number }> = {}
    noRange.forEach(v => {
      const key = v.clienteNome || 'Consumidor Final'
      if (!clientMap[key]) clientMap[key] = { nome: key, total: 0, qtd: 0 }
      clientMap[key].total += v.total
      clientMap[key].qtd += 1
    })
    const topClientes = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 10)

    const canceladas = vendas.filter(v => v.status === 'cancelada' && v.criadoEm?.substring(0, 10) >= range.de && v.criadoEm?.substring(0, 10) <= range.ate).length

    // Daily totals for sparkline
    const daily: Record<string, number> = {}
    noRange.forEach(v => {
      const d = v.criadoEm.substring(0, 10)
      daily[d] = (daily[d] || 0) + v.total
    })

    return { totalPeriodo, qtd, ticket, canceladas, formas, topProdutos, topClientes, daily }
  }, [vendas, range.de, range.ate])

  // Financial report
  const finReport = useMemo(() => {
    const cpPendentes = contasPagar.filter(c => !c.pago)
    const crPendentes = contasReceber.filter(c => !c.recebido)
    const cpAtrasadas = cpPendentes.filter(c => c.vencimento < hoje)
    const crAtrasadas = crPendentes.filter(c => c.vencimento < hoje)
    const despPendentes = despesas.filter(d => !d.pago)

    // Contas por vencimento próximo
    const cpProximas = cpPendentes.filter(c => {
      const d = new Date(c.vencimento)
      const diff = (d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 7
    })

    return {
      totalAPagar: cpPendentes.reduce((s, c) => s + c.valor, 0),
      totalAReceber: crPendentes.reduce((s, c) => s + c.valor, 0),
      cpAtrasadas: cpAtrasadas.length,
      crAtrasadas: crAtrasadas.length,
      totalDespPendentes: despPendentes.reduce((s, d) => s + d.valor, 0),
      totalAPagarAtrasado: cpAtrasadas.reduce((s, c) => s + c.valor, 0),
      totalAReceberAtrasado: crAtrasadas.reduce((s, c) => s + c.valor, 0),
      cpProximas: cpProximas.length,
    }
  }, [contasPagar, contasReceber, despesas, hoje])

  // Stock report
  const stockReport = useMemo(() => {
    const ativos = produtos.filter(p => p.ativo && p.tipo === 'produto')
    const baixoEstoque = ativos.filter(p => p.estoque <= p.estoqueMinimo)
    const semEstoque = ativos.filter(p => p.estoque === 0)
    const valorTotal = ativos.reduce((s, p) => s + (p.estoque * p.preco), 0)
    const valorCusto = ativos.reduce((s, p) => s + (p.estoque * (p.precoCusto || 0)), 0)
    const margemMedia = valorCusto > 0 ? ((valorTotal - valorCusto) / valorCusto) * 100 : 0

    return { total: produtos.length, ativos: ativos.length, baixoEstoque, semEstoque, valorTotal, valorCusto, margemMedia }
  }, [produtos])

  const presets: { id: PeriodoPreset; label: string }[] = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mes' },
    { id: 'trimestre', label: 'Ultimos 3 Meses' },
    { id: 'ano', label: 'Este Ano' },
    { id: 'custom', label: 'Personalizado' },
  ]

  const maxFormaValue = Math.max(...Object.values(vendasReport.formas), 1)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                <BarChart3 size={20} className="text-white" />
              </div>
              Relatorios
            </h1>
            <p className="text-sm text-gray-400 mt-1">Analise detalhada do seu negocio</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Export PDF button */}
            <button
              onClick={() => {
                if (aba === 'vendas') {
                  const periodoStr = range.de === range.ate
                    ? new Date(range.de + 'T12:00:00').toLocaleDateString('pt-BR')
                    : `${new Date(range.de + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(range.ate + 'T12:00:00').toLocaleDateString('pt-BR')}`
                  exportVendasPdf(vendasReport, empresaNome, periodoStr)
                } else if (aba === 'financeiro') {
                  exportFinanceiroPdf(finReport, empresaNome)
                } else {
                  exportEstoquePdf(stockReport, empresaNome, clientes.length, clientes.filter(c => c.ativo).length)
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-primary-hover hover:to-violet-700 transition-all shadow-sm hover:shadow-md"
            >
              <Download size={16} />
              Exportar PDF
            </button>

            {/* Period filter - only for vendas tab */}
            {aba === 'vendas' && (
              <>
              <div className="relative">
                <button
                  onClick={() => setShowPeriodoMenu(!showPeriodoMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <Calendar size={16} className="text-primary" />
                  {range.label}
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {showPeriodoMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPeriodoMenu(false)} />
                    <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2 min-w-[200px] animate-fade-in">
                      {presets.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setPeriodo(p.id); if (p.id !== 'custom') setShowPeriodoMenu(false) }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                            periodo === p.id ? 'text-primary font-semibold bg-primary/5' : 'text-gray-600'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                      {periodo === 'custom' && (
                        <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                          <div>
                            <label className="text-[11px] text-gray-400 font-medium">De</label>
                            <input type="date" value={customDe} onChange={e => setCustomDe(e.target.value)}
                              className="w-full mt-0.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-400 font-medium">Ate</label>
                            <input type="date" value={customAte} onChange={e => setCustomAte(e.target.value)}
                              className="w-full mt-0.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                          </div>
                          <button onClick={() => setShowPeriodoMenu(false)}
                            className="w-full mt-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
                            Aplicar
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-50 rounded-xl text-xs text-gray-500 font-medium">
                <Filter size={12} />
                {range.de === range.ate ? new Date(range.de + 'T12:00:00').toLocaleDateString('pt-BR') : `${new Date(range.de + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(range.ate + 'T12:00:00').toLocaleDateString('pt-BR')}`}
              </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100/80 p-1 rounded-2xl mb-6 w-fit">
          {([
            { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
            { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
            { id: 'estoque', label: 'Estoque', icon: Box },
          ] as { id: Aba; label: string; icon: typeof ShoppingCart }[]).map(t => (
            <button key={t.id} onClick={() => setAba(t.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                aba === t.id
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* ============ VENDAS TAB ============ */}
        {aba === 'vendas' && (
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden group hover:shadow-elevated transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <DollarSign size={16} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Vendas</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(vendasReport.totalPeriodo)}</p>
              </div>

              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden group hover:shadow-elevated transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Hash size={16} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantidade</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{vendasReport.qtd}</p>
              </div>

              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden group hover:shadow-elevated transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-purple-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                    <TrendingUp size={16} className="text-violet-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ticket Medio</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(vendasReport.ticket)}</p>
              </div>

              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden group hover:shadow-elevated transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-red-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                    <TrendingDown size={16} className="text-rose-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Canceladas</span>
                </div>
                <p className="text-2xl font-bold text-rose-600">{vendasReport.canceladas}</p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard size={16} className="text-primary" />
                </div>
                <h3 className="text-sm font-bold text-gray-700">Vendas por Forma de Pagamento</h3>
              </div>
              <div className="p-6">
                {Object.keys(vendasReport.formas).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhuma venda no periodo selecionado</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(vendasReport.formas).sort(([, a], [, b]) => b - a).map(([forma, valor]) => {
                      const pct = vendasReport.totalPeriodo > 0 ? (valor / vendasReport.totalPeriodo) * 100 : 0
                      const Icon = formaIcons[forma] || FileText
                      const gradient = formaColors[forma] || 'from-gray-500 to-gray-600'
                      return (
                        <div key={forma} className="group">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                                <Icon size={14} className="text-white" />
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{formaLabel[forma] || forma}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-400">{pct.toFixed(1)}%</span>
                              <span className="text-sm font-bold text-gray-800 min-w-[90px] text-right">{formatCurrency(valor)}</span>
                            </div>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out`}
                              style={{ width: `${Math.max(3, (valor / maxFormaValue) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Top Products & Top Clients side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top Products */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Award size={16} className="text-amber-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">Top 10 Produtos</h3>
                </div>
                <div className="p-5">
                  {vendasReport.topProdutos.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Nenhuma venda no periodo</p>
                  ) : (
                    <div className="space-y-1">
                      {vendasReport.topProdutos.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50/80 transition-colors">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-sm' :
                            i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                            i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{p.nome}</p>
                            <p className="text-[11px] text-gray-400">{p.qtd} unidade(s)</p>
                          </div>
                          <span className="text-sm font-bold text-gray-800">{formatCurrency(p.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Clients */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">Top 10 Clientes</h3>
                </div>
                <div className="p-5">
                  {vendasReport.topClientes.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Nenhuma venda no periodo</p>
                  ) : (
                    <div className="space-y-1">
                      {vendasReport.topClientes.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50/80 transition-colors">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            i === 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm' :
                            i === 1 ? 'bg-gradient-to-br from-blue-300 to-blue-400 text-white' :
                            i === 2 ? 'bg-gradient-to-br from-blue-200 to-blue-300 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{c.nome}</p>
                            <p className="text-[11px] text-gray-400">{c.qtd} venda(s)</p>
                          </div>
                          <span className="text-sm font-bold text-gray-800">{formatCurrency(c.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ FINANCEIRO TAB ============ */}
        {aba === 'financeiro' && (
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <ArrowUpRight size={16} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">A Receber</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(finReport.totalAReceber)}</p>
                {finReport.crAtrasadas > 0 && (
                  <p className="text-xs text-rose-500 mt-1.5 font-semibold flex items-center gap-1">
                    <AlertTriangle size={11} /> {finReport.crAtrasadas} atrasada(s): {formatCurrency(finReport.totalAReceberAtrasado)}
                  </p>
                )}
              </div>

              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-red-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                    <ArrowDownRight size={16} className="text-rose-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">A Pagar</span>
                </div>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(finReport.totalAPagar)}</p>
                {finReport.cpAtrasadas > 0 && (
                  <p className="text-xs text-rose-500 mt-1.5 font-semibold flex items-center gap-1">
                    <AlertTriangle size={11} /> {finReport.cpAtrasadas} atrasada(s): {formatCurrency(finReport.totalAPagarAtrasado)}
                  </p>
                )}
              </div>

              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <DollarSign size={16} className="text-amber-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Despesas</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(finReport.totalDespPendentes)}</p>
                <p className="text-xs text-gray-400 mt-1.5 font-medium">Pendentes</p>
              </div>

              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-purple-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Calendar size={16} className="text-violet-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vencem em 7 dias</span>
                </div>
                <p className="text-2xl font-bold text-violet-600">{finReport.cpProximas}</p>
                <p className="text-xs text-gray-400 mt-1.5 font-medium">conta(s) a pagar</p>
              </div>
            </div>

            {/* Balance */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 size={16} className="text-primary" />
                </div>
                <h3 className="text-sm font-bold text-gray-700">Balanco Geral</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-emerald-50/60">
                    <div className="flex items-center gap-2.5">
                      <ArrowUpRight size={16} className="text-emerald-600" />
                      <span className="text-sm font-medium text-gray-700">Total a Receber</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">+{formatCurrency(finReport.totalAReceber)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-rose-50/60">
                    <div className="flex items-center gap-2.5">
                      <ArrowDownRight size={16} className="text-rose-600" />
                      <span className="text-sm font-medium text-gray-700">Total a Pagar</span>
                    </div>
                    <span className="text-sm font-bold text-rose-600">-{formatCurrency(finReport.totalAPagar)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-amber-50/60">
                    <div className="flex items-center gap-2.5">
                      <TrendingDown size={16} className="text-amber-600" />
                      <span className="text-sm font-medium text-gray-700">Despesas Pendentes</span>
                    </div>
                    <span className="text-sm font-bold text-amber-600">-{formatCurrency(finReport.totalDespPendentes)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 mt-2">
                    <div className={`flex justify-between items-center py-4 px-5 rounded-2xl ${
                      finReport.totalAReceber - finReport.totalAPagar - finReport.totalDespPendentes >= 0
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-rose-500 to-red-600'
                    }`}>
                      <span className="text-sm font-bold text-white">Saldo Projetado</span>
                      <span className="text-lg font-bold text-white">
                        {formatCurrency(finReport.totalAReceber - finReport.totalAPagar - finReport.totalDespPendentes)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ ESTOQUE TAB ============ */}
        {aba === 'estoque' && (
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Box size={16} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Produtos</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stockReport.ativos}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">{stockReport.total} cadastrados</p>
              </div>

              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <DollarSign size={16} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor (Venda)</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stockReport.valorTotal)}</p>
              </div>

              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 to-gray-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <DollarSign size={16} className="text-gray-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor (Custo)</span>
                </div>
                <p className="text-2xl font-bold text-gray-600">{formatCurrency(stockReport.valorCusto)}</p>
              </div>

              <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-card overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-purple-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Percent size={16} className="text-violet-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Margem Media</span>
                </div>
                <p className="text-2xl font-bold text-violet-600">{stockReport.margemMedia.toFixed(1)}%</p>
              </div>
            </div>

            {/* Low stock + Summary side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Low Stock */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                      <AlertTriangle size={16} className="text-amber-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700">Estoque Baixo</h3>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">{stockReport.baixoEstoque.length}</span>
                </div>
                <div className="p-5 max-h-96 overflow-y-auto">
                  {stockReport.baixoEstoque.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                        <Box size={24} className="text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">Todos os produtos com estoque OK</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stockReport.baixoEstoque.map(p => {
                        const pct = p.estoqueMinimo > 0 ? (p.estoque / p.estoqueMinimo) * 100 : 0
                        return (
                          <div key={p._id} className="py-3 px-4 rounded-xl bg-gray-50/60 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-800 truncate flex-1">{p.nome}</span>
                              <div className="flex items-center gap-2 ml-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                  p.estoque === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {p.estoque} {p.unidade}
                                </span>
                                <span className="text-[11px] text-gray-400">min: {p.estoqueMinimo}</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${
                                pct === 0 ? 'bg-red-500' : pct < 50 ? 'bg-amber-500' : 'bg-yellow-500'
                              }`} style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 size={16} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">Resumo Geral</h3>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: 'Clientes cadastrados', value: clientes.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Clientes ativos', value: clientes.filter(c => c.ativo).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Produtos sem estoque', value: stockReport.semEstoque.length, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Estoque baixo', value: stockReport.baixoEstoque.length, color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50/80 transition-colors">
                      <span className="text-sm text-gray-600 font-medium">{item.label}</span>
                      <span className={`text-sm font-bold ${item.color} ${item.bg} px-3 py-1 rounded-lg`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
