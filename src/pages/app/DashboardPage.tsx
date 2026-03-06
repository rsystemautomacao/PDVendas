import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShoppingCart, Users, Box, TrendingUp,
  AlertTriangle, ArrowUpRight, ArrowDownRight,
  Package, LayoutDashboard, Plus, BarChart3,
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
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Ola, {user?.nome?.split(' ')[0] || 'Usuario'}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {caixaAberto
              ? `Caixa #${caixaAberto.numero} aberto | ${vendasHoje.length} venda(s) hoje`
              : 'Nenhum caixa aberto. Abra um caixa para iniciar vendas.'
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Link to="/app/novo-pedido" className="card flex items-center gap-3 p-4 hover:border-primary/30 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plus size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Nova Venda</p>
              <p className="text-xs text-gray-400">F2</p>
            </div>
          </Link>
          <Link to="/app/produtos/novo" className="card flex items-center gap-3 p-4 hover:border-primary/30 group">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Package size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Novo Produto</p>
              <p className="text-xs text-gray-400">Cadastrar</p>
            </div>
          </Link>
          <Link to="/app/clientes/novo" className="card flex items-center gap-3 p-4 hover:border-primary/30 group">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Novo Cliente</p>
              <p className="text-xs text-gray-400">F4</p>
            </div>
          </Link>
          <Link to="/app/caixas" className="card flex items-center gap-3 p-4 hover:border-primary/30 group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <LayoutDashboard size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Caixas</p>
              <p className="text-xs text-gray-400">{caixaAberto ? 'Aberto' : 'Fechado'}</p>
            </div>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Vendas Hoje</span>
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <ShoppingCart size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalHoje)}</p>
            <p className="text-xs text-gray-400 mt-1">{vendasHoje.length} venda(s)</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Vendas no Mes</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalMes)}</p>
            <p className="text-xs text-gray-400 mt-1">{vendas.filter(v => v.status === 'finalizada').length} total de vendas</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">A Receber</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight size={16} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(contasReceberPendentes)}</p>
            <p className="text-xs text-gray-400 mt-1">Pendente</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">A Pagar</span>
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <ArrowDownRight size={16} className="text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(contasPagarPendentes)}</p>
            {contasAtrasadas.length > 0 && (
              <p className="text-xs text-red-500 mt-1">{contasAtrasadas.length} atrasada(s)</p>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Low stock alerts */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Estoque Baixo</h2>
              <Link to="/app/produtos" className="text-xs text-primary font-medium hover:underline">Ver todos</Link>
            </div>
            {baixoEstoque.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Box size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Todos os produtos com estoque OK</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {baixoEstoque.slice(0, 8).map(p => (
                  <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{p.nome}</span>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-warning">{p.estoque} {p.unidade}</span>
                      <span className="text-xs text-gray-400 ml-2">min: {p.estoqueMinimo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent sales */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Vendas Recentes</h2>
              <Link to="/app/vendas" className="text-xs text-primary font-medium hover:underline">Ver todas</Link>
            </div>
            {vendas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <BarChart3 size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Nenhuma venda realizada ainda</p>
                <Link to="/app/novo-pedido" className="text-xs text-primary font-medium mt-2 hover:underline">Fazer primeira venda</Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {vendas.slice(-8).reverse().map(v => (
                  <div key={v._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Venda #{v.numero}</p>
                      <p className="text-xs text-gray-400">{v.clienteNome} - {new Date(v.criadoEm).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{formatCurrency(v.total)}</p>
                      <span className={`badge ${v.status === 'finalizada' ? 'badge-success' : v.status === 'cancelada' ? 'badge-danger' : 'badge-warning'}`}>
                        {v.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats overview */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-800">{produtos.filter(p => p.ativo).length}</p>
            <p className="text-xs text-gray-500 mt-1">Produtos ativos</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-800">{clientes.filter(c => c.ativo).length}</p>
            <p className="text-xs text-gray-500 mt-1">Clientes ativos</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-800">{vendas.filter(v => v.status === 'finalizada').length}</p>
            <p className="text-xs text-gray-500 mt-1">Vendas realizadas</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-800">{baixoEstoque.length}</p>
            <p className="text-xs text-gray-500 mt-1">Estoque baixo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
