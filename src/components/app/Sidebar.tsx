import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Home, HelpCircle, Store, Settings, LayoutDashboard,
  ShoppingCart, Users, Box, DollarSign, BarChart3,
  TrendingUp, LogOut, ChevronRight, Building2,
  ShieldCheck, Receipt, X, Wrench, FileText, Sparkles, RefreshCw, AlertTriangle, Tag,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissao } from '../../hooks/usePermissao'
import { useSegmento } from '../../hooks/useSegmento'

interface SidebarProps { onClose?: () => void }

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { temPermissao, isAdmin } = usePermissao()
  const seg = useSegmento()
  const [configOpen, setConfigOpen] = useState(false)

  const handleSair = () => {
    logout()
    navigate('/login', { replace: true })
    onClose?.()
  }

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/app' && location.pathname.startsWith(path + '/'))

  const linkClass = (path: string) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm shadow-primary/5'
        : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-800'
    }`

  const MenuItem = ({ to, icon: Icon, label, perm }: { to: string; icon: typeof Home; label: string; perm?: string }) => {
    if (perm && !temPermissao(perm)) return null
    return (
      <li>
        <Link to={to} className={linkClass(to)} onClick={onClose}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            isActive(to) ? 'bg-primary/15 text-primary' : 'bg-gray-100/80 text-gray-400 group-hover:text-gray-600'
          }`}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
          {label}
        </Link>
      </li>
    )
  }

  const iniciais = user?.nome
    ? user.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const roleLabel = user?.role === 'admin' ? 'Administrador' : user?.role === 'gerente' ? 'Gerente' : 'Operador'
  const roleColor = user?.role === 'admin' ? 'from-primary to-violet-600' : user?.role === 'gerente' ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      {/* Close button */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-md shadow-primary/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-800">MeuPDV</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* User Profile Card */}
      <div className="mx-3 mb-4">
        <Link
          to="/app/config/meu-usuario"
          onClick={onClose}
          className="block rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 transition-all duration-200 hover:shadow-soft group border border-gray-100/80"
        >
          <div className="flex items-center gap-3.5">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${roleColor} text-white text-sm font-bold shadow-lg shadow-primary/20`}>
              {iniciais}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-800 text-sm leading-tight">{user?.nome || 'Usuario'}</p>
              <p className="truncate text-xs text-gray-400 mt-0.5">{user?.email || ''}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${roleColor} px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm`}>
                  <ShieldCheck className="h-2.5 w-2.5" />
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {user?.empresa?.nome && (
          <Link
            to="/app/config/minha-empresa"
            onClick={onClose}
            className="mt-2 flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-100"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
              <Building2 className="h-3.5 w-3.5 text-violet-500" />
            </div>
            <span className="truncate flex-1 font-medium">{user.empresa.nome}</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          </Link>
        )}
        {localStorage.getItem('meupdv_loja_nome') && (
          <Link
            to="/app/config/lojas"
            onClick={onClose}
            className="mt-1 flex items-center gap-2.5 rounded-xl px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-all duration-200"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50">
              <Store className="h-3 w-3 text-emerald-500" />
            </div>
            <span className="truncate flex-1 font-medium">{localStorage.getItem('meupdv_loja_nome')}</span>
          </Link>
        )}
      </div>

      {/* Main menu */}
      <nav className="flex-1 px-3 pb-3 space-y-5" aria-label="Menu principal">
        <div>
          <p className="px-3.5 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-300">Principal</p>
          <ul className="space-y-0.5">
            <MenuItem to="/app" icon={Home} label="Inicio" />
            <MenuItem to="/app/novo-pedido" icon={ShoppingCart} label="Nova Venda (PDV)" perm="vendas.criar" />
            <MenuItem to="/app/vendas" icon={Receipt} label="Vendas" perm="vendas.visualizar" />
            <MenuItem to="/app/trocas" icon={RefreshCw} label="Trocas/Devoluções" perm="vendas.visualizar" />
          </ul>
        </div>

        {seg.mostrarOrdensServico && (
        <div>
          <p className="px-3.5 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-300">Assistencia Tecnica</p>
          <ul className="space-y-0.5">
            <MenuItem to="/app/ordens-servico" icon={Wrench} label="Ordens de Servico" />
            <MenuItem to="/app/orcamentos" icon={FileText} label="Orcamentos" />
          </ul>
        </div>
        )}

        {(temPermissao('produtos.visualizar') || temPermissao('clientes.visualizar')) && (
          <div>
            <p className="px-3.5 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-300">Cadastros</p>
            <ul className="space-y-0.5">
              <MenuItem to="/app/clientes" icon={Users} label="Clientes" perm="clientes.visualizar" />
              <MenuItem to="/app/produtos" icon={Box} label="Produtos" perm="produtos.visualizar" />
              <MenuItem to="/app/validade" icon={AlertTriangle} label="Validade" perm="produtos.visualizar" />
              <MenuItem to="/app/etiquetas" icon={Tag} label="Etiquetas" perm="produtos.visualizar" />
            </ul>
          </div>
        )}

        {(temPermissao('caixa.abrir') || temPermissao('financeiro.contas_pagar') || temPermissao('financeiro.contas_receber') || temPermissao('financeiro.despesas') || temPermissao('financeiro.fluxo_caixa')) && (
          <div>
            <p className="px-3.5 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-300">Financeiro</p>
            <ul className="space-y-0.5">
              <MenuItem to="/app/caixas" icon={LayoutDashboard} label="Caixas" perm="caixa.abrir" />
              <MenuItem to="/app/contas-a-pagar" icon={DollarSign} label="Contas a Pagar" perm="financeiro.contas_pagar" />
              <MenuItem to="/app/contas-a-receber" icon={DollarSign} label="Contas a Receber" perm="financeiro.contas_receber" />
              <MenuItem to="/app/despesas" icon={Receipt} label="Despesas" perm="financeiro.despesas" />
              <MenuItem to="/app/fluxo-de-caixa" icon={TrendingUp} label="Fluxo de Caixa" perm="financeiro.fluxo_caixa" />
            </ul>
          </div>
        )}

        {temPermissao('relatorios.visualizar') && (
          <div>
            <p className="px-3.5 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-300">Relatorios</p>
            <ul className="space-y-0.5">
              <MenuItem to="/app/relatorios-graficos" icon={BarChart3} label="Relatorios" perm="relatorios.visualizar" />
              <MenuItem to="/app/comissoes" icon={TrendingUp} label="Comissoes" perm="relatorios.visualizar" />
              <MenuItem to="/app/catalogo" icon={Store} label="Catalogo" perm="relatorios.visualizar" />
            </ul>
          </div>
        )}

        <div>
          <p className="px-3.5 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-300">Sistema</p>
          <ul className="space-y-0.5">
            {isAdmin && (
              <li>
                <button
                  type="button"
                  onClick={() => setConfigOpen(o => !o)}
                  className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-gray-500 hover:bg-gray-50/80 hover:text-gray-800 transition-all duration-200"
                >
                  <span className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100/80 text-gray-400">
                      <Settings className="h-[18px] w-[18px]" />
                    </div>
                    Configuracoes
                  </span>
                  <ChevronRight className={`h-4 w-4 text-gray-300 transition-transform duration-200 ${configOpen ? 'rotate-90' : ''}`} />
                </button>
                {configOpen && (
                  <ul className="ml-5 mt-1.5 space-y-0.5 border-l-2 border-primary/10 pl-3 animate-fade-in">
                    <li><Link to="/app/config/meu-usuario" className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive('/app/config/meu-usuario') ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>Meu usuario</Link></li>
                    <li><Link to="/app/config/minha-empresa" className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive('/app/config/minha-empresa') ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>Minha empresa</Link></li>
                    <li><Link to="/app/config/parametros" className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive('/app/config/parametros') ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>Parametros</Link></li>
                    <li><Link to="/app/config/usuarios" className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive('/app/config/usuarios') ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>Usuarios</Link></li>
                    <li><Link to="/app/config/permissoes" className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive('/app/config/permissoes') ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>Permissoes</Link></li>
                    <li><Link to="/app/config/impressoras" className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive('/app/config/impressoras') ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>Impressoras</Link></li>
                    <li><Link to="/app/config/lojas" className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive('/app/config/lojas') ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={onClose}>Lojas</Link></li>
                  </ul>
                )}
              </li>
            )}
            <MenuItem to="/app/ajuda" icon={HelpCircle} label="Ajuda" />
          </ul>
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100/80 p-3">
        <button
          type="button"
          onClick={handleSair}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 active:scale-[0.97]"
        >
          <LogOut className="h-4 w-4" /> Sair da conta
        </button>
      </div>
    </div>
  )
}
