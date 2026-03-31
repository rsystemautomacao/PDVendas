import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  X,
  ShoppingCart,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Building2,
  Settings,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import type { Notificacao } from '../../types'

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const [naoLidas, setNaoLidas] = useState(0)

  useEffect(() => {
    api.get<Notificacao[]>('/notificacoes')
      .then(res => {
        if (res.success && res.data) {
          setNaoLidas(res.data.filter(n => !n.lida).length)
        }
      })
      .catch(() => {})
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    },
    []
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileOpen])

  const handleLogout = useCallback(() => {
    setProfileOpen(false)
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const iniciais = user?.nome
    ? user.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex min-h-topbar items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-3 py-2 shadow-sm md:gap-4 md:px-5 print:hidden"
      role="banner"
    >
      {/* Hamburger + Logo */}
      <div className="flex flex-shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          to="/app"
          className="flex items-center gap-2.5 text-gray-800 no-underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-md shadow-primary/20">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-bold leading-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">MeuPDV</span>
            <span className="text-[10px] text-gray-400 font-medium">Sistema de Gestao</span>
          </div>
          <span className="text-sm font-bold sm:hidden bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">MeuPDV</span>
        </Link>
      </div>

      {/* Search - desktop */}
      <div className="relative flex-1 max-w-lg">
        <div className="hidden md:flex relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            placeholder="Pesquisar..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full rounded-xl border border-gray-200/80 bg-gray-50/80 py-2.5 pl-10 pr-20 text-sm text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/15 focus:border-primary focus:bg-white transition-all"
            aria-label="Pesquisar"
          />
          <span className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <kbd className="rounded-lg bg-gray-100 border border-gray-200/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">Ctrl K</kbd>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 md:hidden"
          aria-label="Abrir pesquisa"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Search overlay mobile */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden" aria-hidden>
          <div className="mt-16 mx-3 rounded-2xl bg-white p-3 shadow-float border border-gray-100">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <input
                type="search"
                placeholder="Pesquisar..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1 border-0 text-gray-800 placeholder:text-gray-400 focus:outline-none text-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fechar pesquisa"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right icons */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <Link
          to="/app/novo-pedido"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-primary/5 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Nova venda"
        >
          <ShoppingCart className="h-[18px] w-[18px]" />
        </Link>
        <Link
          to="/app/notificacoes"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label={`Notificacoes${naoLidas > 0 ? ` (${naoLidas} nao lidas)` : ''}`}
        >
          <Bell className="h-[18px] w-[18px]" />
          {naoLidas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {naoLidas > 99 ? '99+' : naoLidas}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-1.5 hidden sm:block" />

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Menu do usuario"
            aria-expanded={profileOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-xs font-bold text-white shadow-sm shadow-primary/20">
              {iniciais}
            </div>
            <span className="hidden text-sm font-semibold md:block">{user?.nome?.split(' ')[0] || 'Usuario'}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-gray-100/80 bg-white shadow-float animate-scale-in z-50 overflow-hidden">
              {/* Profile header */}
              <div className="bg-gradient-to-br from-primary/5 to-violet-50/50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-sm font-bold text-white shadow-md shadow-primary/20">
                    {iniciais}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate text-sm">{user?.nome || 'Usuario'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                  </div>
                </div>
                <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-primary shadow-sm border border-primary/10">
                  <ShoppingCart className="h-2.5 w-2.5" />
                  {user?.role === 'admin' ? 'Administrador' : user?.role === 'gerente' ? 'Gerente' : 'Operador'}
                </span>
              </div>

              <div className="py-2 px-2">
                <Link
                  to="/app/config/meu-usuario"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <User className="h-4 w-4 text-blue-500" />
                  </div>
                  Meu Usuario
                </Link>
                <Link
                  to="/app/config/minha-empresa"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                    <Building2 className="h-4 w-4 text-violet-500" />
                  </div>
                  Minha Empresa
                </Link>
                <Link
                  to="/app/config/parametros"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <Settings className="h-4 w-4 text-gray-500" />
                  </div>
                  Configuracoes
                </Link>
              </div>

              <div className="border-t border-gray-100 p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                    <LogOut className="h-4 w-4 text-red-500" />
                  </div>
                  Sair da conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
