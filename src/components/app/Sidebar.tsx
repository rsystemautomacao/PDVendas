import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Home, HelpCircle, Store, Settings, LayoutDashboard,
  ShoppingCart, Users, Box, DollarSign, BarChart3,
  TrendingUp, LogOut, ChevronRight, User, Building2,
  ShieldCheck, Receipt, X, Pencil,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface SidebarProps { onClose?: () => void }

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [configOpen, setConfigOpen] = useState(false)

  const handleSair = () => {
    logout()
    navigate('/login', { replace: true })
    onClose?.()
  }

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/app' && location.pathname.startsWith(path + '/'))

  const linkClass = (path: string) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive(path) ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-100'
    }`

  const MenuItem = ({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) => (
    <li>
      <Link to={to} className={linkClass(to)} onClick={onClose}>
        <Icon className="h-4 w-4 flex-shrink-0" /> {label}
      </Link>
    </li>
  )

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Close button */}
      <div className="flex items-center justify-end border-b border-gray-100 px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" /> Fechar
        </button>
      </div>

      {/* User info */}
      <div className="border-b border-gray-100 px-3 py-4">
        <Link
          to="/app/config/meu-usuario"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg p-1.5 -m-1.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-800 text-sm">{user?.nome || 'Usuario'}</p>
            <p className="truncate text-xs text-gray-500">{user?.email || ''}</p>
            <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <ShieldCheck className="h-3 w-3" />
              {user?.role === 'admin' ? 'Administrador' : user?.role === 'gerente' ? 'Gerente' : 'Operador'}
            </p>
          </div>
          <Pencil className="h-3.5 w-3.5 text-gray-400" />
        </Link>
        {user?.empresa?.nome && (
          <Link
            to="/app/config/minha-empresa"
            onClick={onClose}
            className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Building2 className="h-3 w-3" />
            <span className="truncate flex-1">{user.empresa.nome}</span>
            <Pencil className="h-3 w-3 text-gray-400" />
          </Link>
        )}
      </div>

      {/* Main menu */}
      <nav className="flex-1 px-2 py-3" aria-label="Menu principal">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Principal</p>
        <ul className="space-y-0.5">
          <MenuItem to="/app" icon={Home} label="Inicio" />
          <MenuItem to="/app/novo-pedido" icon={ShoppingCart} label="Nova Venda (PDV)" />
          <MenuItem to="/app/vendas" icon={ShoppingCart} label="Vendas" />
        </ul>

        <p className="px-3 mt-5 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Cadastros</p>
        <ul className="space-y-0.5">
          <MenuItem to="/app/clientes" icon={Users} label="Clientes" />
          <MenuItem to="/app/produtos" icon={Box} label="Produtos" />
        </ul>

        <p className="px-3 mt-5 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Financeiro</p>
        <ul className="space-y-0.5">
          <MenuItem to="/app/caixas" icon={LayoutDashboard} label="Caixas" />
          <MenuItem to="/app/contas-a-pagar" icon={DollarSign} label="Contas a Pagar" />
          <MenuItem to="/app/contas-a-receber" icon={DollarSign} label="Contas a Receber" />
          <MenuItem to="/app/despesas" icon={Receipt} label="Despesas" />
          <MenuItem to="/app/fluxo-de-caixa" icon={TrendingUp} label="Fluxo de Caixa" />
        </ul>

        <p className="px-3 mt-5 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Relatorios</p>
        <ul className="space-y-0.5">
          <MenuItem to="/app/relatorios-graficos" icon={BarChart3} label="Relatorios" />
          <MenuItem to="/app/catalogo" icon={Store} label="Catalogo" />
        </ul>

        <p className="px-3 mt-5 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Sistema</p>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => setConfigOpen(o => !o)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-2.5"><Settings className="h-4 w-4" /> Configuracoes</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${configOpen ? 'rotate-90' : ''}`} />
            </button>
            {configOpen && (
              <ul className="ml-4 mt-1 space-y-0.5 border-l border-gray-200 pl-2 animate-fade-in">
                <li><Link to="/app/config/meu-usuario" className={linkClass('/app/config/meu-usuario')} onClick={onClose}>Meu usuario</Link></li>
                <li><Link to="/app/config/minha-empresa" className={linkClass('/app/config/minha-empresa')} onClick={onClose}>Minha empresa</Link></li>
                <li><Link to="/app/config/parametros" className={linkClass('/app/config/parametros')} onClick={onClose}>Parametros</Link></li>
                <li><Link to="/app/config/permissoes" className={linkClass('/app/config/permissoes')} onClick={onClose}>Permissoes</Link></li>
              </ul>
            )}
          </li>
          <MenuItem to="/app/ajuda" icon={HelpCircle} label="Ajuda" />
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 p-2">
        <button
          type="button"
          onClick={handleSair}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  )
}
