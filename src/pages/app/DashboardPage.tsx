import { useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShoppingCart, Users, Box, TrendingUp,
  AlertTriangle, ArrowUpRight, ArrowDownRight,
  Package, LayoutDashboard, Plus, BarChart3,
  Sparkles, Zap,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useVendas } from '../../contexts/VendaContext'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useClientes } from '../../contexts/ClienteContext'
import { useCaixa } from '../../contexts/CaixaContext'
import { useFinanceiro } from '../../contexts/FinanceiroContext'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency } from '../../utils/helpers'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { vendas, getTotalVendasHoje, getTotalVendasMes, getVendasHoje } = useVendas()
  const { produtos, produtosBaixoEstoque } = useProdutos()
  const { clientes } = useClientes()
  const { caixaAberto } = useCaixa()
  const { getTotalContasPagarPendentes, getTotalContasReceberPendentes, getContasPagarAtrasadas } = useFinanceiro()

  const vendasHoje = getVendasHoje()
  const totalHoje = getTotalVendasHoje()
  const totalMes = getTotalVendasMes()
  const baixoEstoque = produtosBaixoEstoque()
  const contasPagarPendentes = getTotalContasPagarPendentes()
  const contasReceberPendentes = getTotalContasReceberPendentes()
  const contasAtrasadas = getContasPagarAtrasadas()

  // Dados para gráfico: vendas dos últimos 7 dias
  const vendasUltimos7Dias = useMemo(() => {
    const dias: { dia: string; total: number; qtd: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
      const vendasDia = vendas.filter(v => v.status === 'finalizada' && v.criadoEm.startsWith(dStr))
      dias.push({
        dia: label.charAt(0).toUpperCase() + label.slice(1),
        total: vendasDia.reduce((s, v) => s + v.total, 0),
        qtd: vendasDia.length,
      })
    }
    return dias
  }, [vendas])

  // Dados para gráfico de pizza: formas de pagamento (mês atual)
  const formasPagamento = useMemo(() => {
    const mesAtual = new Date().toISOString().slice(0, 7)
    const vendaMes = vendas.filter(v => v.status === 'finalizada' && v.criadoEm.startsWith(mesAtual))
    const map: Record<string, number> = {}
    vendaMes.forEach(v => {
      v.pagamentos?.forEach(p => {
        const label = p.forma === 'dinheiro' ? 'Dinheiro' : p.forma === 'credito' ? 'Credito' :
          p.forma === 'debito' ? 'Debito' : p.forma === 'pix' ? 'PIX' :
          p.forma === 'boleto' ? 'Boleto' : 'Crediario'
        map[label] = (map[label] || 0) + p.valor
      })
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [vendas])

  // Produtos mais vendidos (mês atual)
  const topProdutos = useMemo(() => {
    const mesAtual = new Date().toISOString().slice(0, 7)
    const vendaMes = vendas.filter(v => v.status === 'finalizada' && v.criadoEm.startsWith(mesAtual))
    const map: Record<string, { nome: string; qtd: number; total: number }> = {}
    vendaMes.forEach(v => {
      v.itens?.forEach(item => {
        if (!map[item.produtoId]) map[item.produtoId] = { nome: item.nome, qtd: 0, total: 0 }
        map[item.produtoId].qtd += item.quantidade
        map[item.produtoId].total += item.total
      })
    })
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [vendas])

  // Ticket médio
  const ticketMedio = useMemo(() => {
    const finalizadas = vendas.filter(v => v.status === 'finalizada')
    if (finalizadas.length === 0) return 0
    return finalizadas.reduce((s, v) => s + v.total, 0) / finalizadas.length
  }, [vendas])

  // Horários de pico (vendas por hora hoje)
  const vendasPorHora = useMemo(() => {
    const horas: { hora: string; qtd: number }[] = []
    for (let h = 7; h <= 22; h++) {
      const qtd = vendasHoje.filter(v => new Date(v.criadoEm).getHours() === h).length
      horas.push({ hora: `${h}h`, qtd })
    }
    return horas
  }, [vendasHoje])

  const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6']

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'F2') { e.preventDefault(); navigate('/app/novo-pedido') }
      if (e.key === 'F4') { e.preventDefault(); navigate('/app/clientes') }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Welcome Banner */}
        <div className="mb-8 rounded-3xl bg-gradient-to-br from-primary via-violet-600 to-purple-700 p-7 md:p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-sm" />
          <div className="absolute right-24 bottom--4 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute left-1/2 -bottom-12 h-24 w-64 rounded-full bg-gradient-to-r from-violet-400/20 to-transparent blur-2xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-violet-200" />
                <span className="text-xs font-semibold text-violet-200 uppercase tracking-wider">Dashboard</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Ola, {user?.nome?.split(' ')[0] || 'Usuario'}!
              </h1>
              <p className="text-sm text-violet-100/80 mt-2 max-w-md">
                {caixaAberto
                  ? `Caixa #${caixaAberto.numero} aberto | ${vendasHoje.length} venda(s) hoje`
                  : 'Nenhum caixa aberto. Abra um caixa para iniciar vendas.'
                }
              </p>
            </div>
            {!caixaAberto && (
              <Link
                to="/app/caixas"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/25 transition-all duration-200 shadow-lg self-start"
              >
                <Zap className="h-4 w-4" /> Abrir Caixa
              </Link>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-8">
          <Link to="/app/novo-pedido" className="group relative rounded-2xl border border-gray-100/80 bg-white p-4 md:p-5 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Plus size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Nova Venda</p>
                <p className="text-[11px] text-gray-400 font-medium">F2</p>
              </div>
            </div>
          </Link>
          <Link to="/app/produtos/novo" className="group relative rounded-2xl border border-gray-100/80 bg-white p-4 md:p-5 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Package size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Novo Produto</p>
                <p className="text-[11px] text-gray-400 font-medium">Cadastrar</p>
              </div>
            </div>
          </Link>
          <Link to="/app/clientes/novo" className="group relative rounded-2xl border border-gray-100/80 bg-white p-4 md:p-5 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Novo Cliente</p>
                <p className="text-[11px] text-gray-400 font-medium">F4</p>
              </div>
            </div>
          </Link>
          <Link to="/app/caixas" className="group relative rounded-2xl border border-gray-100/80 bg-white p-4 md:p-5 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <LayoutDashboard size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Caixas</p>
                <p className="text-[11px] font-medium">
                  {caixaAberto
                    ? <span className="text-emerald-500">Aberto</span>
                    : <span className="text-gray-400">Fechado</span>
                  }
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/app/relatorios?aba=vendas" className="stat-card group cursor-pointer">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 to-green-500" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendas Hoje</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart size={18} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">{formatCurrency(totalHoje)}</p>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">{vendasHoje.length} venda(s)</p>
          </Link>

          <Link to="/app/relatorios?aba=vendas" className="stat-card group cursor-pointer">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-400 to-indigo-500" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendas no Mes</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp size={18} className="text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">{formatCurrency(totalMes)}</p>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">{vendas.filter(v => v.status === 'finalizada').length} total de vendas</p>
          </Link>

          <Link to="/app/relatorios?aba=financeiro" className="stat-card group cursor-pointer">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-teal-400 to-emerald-500" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">A Receber</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ArrowUpRight size={18} className="text-teal-600" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-emerald-600 tracking-tight">{formatCurrency(contasReceberPendentes)}</p>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">Pendente</p>
          </Link>

          <Link to="/app/relatorios?aba=financeiro" className="stat-card group cursor-pointer">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-rose-400 to-red-500" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">A Pagar</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ArrowDownRight size={18} className="text-rose-600" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-rose-600 tracking-tight">{formatCurrency(contasPagarPendentes)}</p>
            {contasAtrasadas.length > 0 && (
              <p className="text-xs text-rose-500 mt-1.5 font-semibold">{contasAtrasadas.length} atrasada(s)</p>
            )}
          </Link>
        </div>

        {/* Ticket Médio card */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-100/80 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ticket Medio</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(ticketMedio)}</p>
            <p className="text-xs text-gray-400 mt-1">media por venda</p>
          </div>
          <div className="rounded-2xl border border-gray-100/80 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Produtos Vendidos Hoje</p>
            <p className="text-2xl font-bold text-gray-800">{vendasHoje.reduce((s, v) => s + (v.itens?.reduce((si, it) => si + it.quantidade, 0) || 0), 0)}</p>
            <p className="text-xs text-gray-400 mt-1">unidades</p>
          </div>
          <div className="rounded-2xl border border-gray-100/80 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Clientes Atendidos Hoje</p>
            <p className="text-2xl font-bold text-gray-800">{new Set(vendasHoje.filter(v => v.clienteId).map(v => v.clienteId)).size || vendasHoje.length}</p>
            <p className="text-xs text-gray-400 mt-1">clientes</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 mb-8">
          {/* Vendas últimos 7 dias */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-100/80 bg-white shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-700">Vendas - Ultimos 7 Dias</h2>
            </div>
            <div className="p-4" style={{ height: 260 }}>
              {vendasUltimos7Dias.some(d => d.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendasUltimos7Dias}>
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                      formatter={(value: any) => [formatCurrency(Number(value)), 'Total']}
                      labelStyle={{ fontWeight: 600, color: '#374151' }}
                    />
                    <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                  <p className="text-sm">Sem vendas nos ultimos 7 dias</p>
                </div>
              )}
            </div>
          </div>

          {/* Formas de pagamento */}
          <div className="rounded-2xl border border-gray-100/80 bg-white shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-700">Formas de Pagamento</h2>
              <p className="text-[11px] text-gray-400">Este mes</p>
            </div>
            <div className="p-4" style={{ height: 260 }}>
              {formasPagamento.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formasPagamento}
                      cx="50%"
                      cy="45%"
                      outerRadius={70}
                      innerRadius={40}
                      dataKey="value"
                      paddingAngle={3}
                      stroke="none"
                    >
                      {formasPagamento.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value: string) => <span className="text-gray-600">{value}</span>}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                  <p className="text-sm">Sem dados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Produtos mais vendidos + Horário de pico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-8">
          {/* Top Produtos */}
          <div className="rounded-2xl border border-gray-100/80 bg-white shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-700">Produtos Mais Vendidos</h2>
              <p className="text-[11px] text-gray-400">Este mes</p>
            </div>
            <div className="p-5">
              {topProdutos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sem vendas no mes</p>
              ) : (
                <div className="space-y-3">
                  {topProdutos.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                        i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-700' : 'bg-gray-300'
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{p.nome}</p>
                        <p className="text-[11px] text-gray-400">{p.qtd} un. vendidas</p>
                      </div>
                      <p className="text-sm font-bold text-gray-800">{formatCurrency(p.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Horário de pico */}
          <div className="rounded-2xl border border-gray-100/80 bg-white shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-700">Horario de Pico</h2>
              <p className="text-[11px] text-gray-400">Vendas por hora (hoje)</p>
            </div>
            <div className="p-4" style={{ height: 220 }}>
              {vendasHoje.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendasPorHora}>
                    <XAxis dataKey="hora" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                      formatter={(value: any) => [`${value} venda(s)`, '']}
                    />
                    <Bar dataKey="qtd" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                  <p className="text-sm">Sem vendas hoje</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {/* Low stock alerts */}
          <div className="rounded-2xl border border-gray-100/80 bg-white shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-amber-500" />
                </div>
                <h2 className="text-sm font-bold text-gray-700">Estoque Baixo</h2>
              </div>
              <Link to="/app/produtos" className="text-xs text-primary font-semibold hover:text-primary-hover transition-colors">Ver todos</Link>
            </div>
            <div className="p-5">
              {baixoEstoque.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                    <Box size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Todos os produtos com estoque OK</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {baixoEstoque.slice(0, 8).map(p => (
                    <div key={p._id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" />
                        <span className="text-sm text-gray-700 font-medium">{p.nome}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="badge badge-warning">{p.estoque} {p.unidade}</span>
                        <span className="text-[11px] text-gray-400">min: {p.estoqueMinimo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent sales */}
          <div className="rounded-2xl border border-gray-100/80 bg-white shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 size={16} className="text-primary" />
                </div>
                <h2 className="text-sm font-bold text-gray-700">Vendas Recentes</h2>
              </div>
              <Link to="/app/vendas" className="text-xs text-primary font-semibold hover:text-primary-hover transition-colors">Ver todas</Link>
            </div>
            <div className="p-5">
              {vendas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                    <BarChart3 size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Nenhuma venda realizada ainda</p>
                  <Link to="/app/novo-pedido" className="text-xs text-primary font-semibold mt-2 hover:text-primary-hover transition-colors">Fazer primeira venda</Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {vendas.slice(-8).reverse().map(v => (
                    <div key={v._id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50/80 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Venda #{v.numero}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{v.clienteNome} - {new Date(v.criadoEm).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className={`badge ${v.status === 'finalizada' ? 'badge-success' : v.status === 'cancelada' ? 'badge-danger' : 'badge-warning'}`}>
                          {v.status}
                        </span>
                        <p className="text-sm font-bold text-gray-800 min-w-[80px] text-right">{formatCurrency(v.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats overview */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {[
            { value: produtos.filter(p => p.ativo).length, label: 'Produtos ativos', color: 'from-primary/5 to-violet-50', textColor: 'text-primary' },
            { value: clientes.filter(c => c.ativo).length, label: 'Clientes ativos', color: 'from-blue-50 to-cyan-50', textColor: 'text-blue-600' },
            { value: vendas.filter(v => v.status === 'finalizada').length, label: 'Vendas realizadas', color: 'from-emerald-50 to-green-50', textColor: 'text-emerald-600' },
            { value: baixoEstoque.length, label: 'Estoque baixo', color: 'from-amber-50 to-orange-50', textColor: 'text-amber-600' },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 border border-gray-100/50 text-center hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5`}>
              <p className={`text-3xl font-bold ${stat.textColor} tracking-tight`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
