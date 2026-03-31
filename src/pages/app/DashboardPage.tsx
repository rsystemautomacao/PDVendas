import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShoppingCart, Users, Box, TrendingUp,
  AlertTriangle, ArrowUpRight, ArrowDownRight,
  Package, LayoutDashboard, Plus, BarChart3,
  Sparkles, Zap,
} from 'lucide-react'
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
