import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  X,
  HelpCircle,
  ShoppingCart,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Building2,
  Settings,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import type { Notificacao } from '../../types'

const TAGLINE = 'SISTEMA DE GESTÃO E VENDAS ONLINE'

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
      className="fixed top-0 left-0 right-0 z-40 flex min-h-topbar items-center gap-3 bg-gradient-to-r from-primary to-blue-800 px-3 py-2 shadow-lg md:gap-4 md:px-4 print:hidden"
      role="banner"
    >
      {/* Hamburger + Logo */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          to="/app"
          className="flex items-center gap-2 text-white no-underline focus:outline-none focus:ring-2 focus:ring-white rounded"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-bold leading-tight">MeuPDV</span>
            <span className="text-xs opacity-90">{TAGLINE}</span>
          </div>
          <span className="text-sm font-bold sm:hidden">MeuPDV</span>
        </Link>
      </div>

      {/* Search - desktop: always visible; mobile: button that opens sheet */}
      <div className="relative flex-1 max-w-xl">
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden />
          <input
            type="search"
            placeholder="Pesquisar função"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full rounded-lg border-0 bg-gray-100 py-2 pl-10 pr-24 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-white"
            aria-label="Pesquisar função"
          />
          <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">CTRL K</kbd>
            <button
              type="button"
              onClick={() => setSearchValue('')}
              className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 md:hidden"
          aria-label="Abrir pesquisa"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Search overlay mobile */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" aria-hidden>
          <div className="mt-14 mx-2 rounded-lg bg-white p-2 shadow-xl">
            <div className="flex gap-2">
              <Search className="h-5 w-5 flex-shrink-0 text-gray-500" />
              <input
                type="search"
                placeholder="Pesquisar função"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1 border-0 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Fechar pesquisa"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right icons */}
      <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
        <Link
          to="/app/ajuda"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Ajuda"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>
        <Link
          to="/app/novo-pedido"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Nova venda"
        >
          <ShoppingCart className="h-5 w-5" />
        </Link>
        <Link
          to="/app/notificacoes"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={`Notificações${naoLidas > 0 ? ` (${naoLidas} não lidas)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {naoLidas > 99 ? '99+' : naoLidas}
            </span>
          )}
        </Link>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Menu do usuário"
            aria-expanded={profileOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {iniciais}
            </div>
            <span className="hidden text-sm font-medium md:block">{user?.nome?.split(' ')[0] || 'Usuário'}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-100 bg-white/95 backdrop-blur-sm shadow-lg animate-fade-in z-50">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="font-semibold text-text-primary truncate">{user?.nome || 'Usuário'}</p>
                <p className="text-sm text-text-secondary truncate">{user?.email || ''}</p>
                <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                  {user?.role || 'admin'}
                </span>
              </div>
              <div className="py-1">
                <Link
                  to="/app/config/meu-usuario"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50"
                >
                  <User className="h-4 w-4 text-text-muted" />
                  Meu Usuário
                </Link>
                <Link
                  to="/app/config/minha-empresa"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50"
                >
                  <Building2 className="h-4 w-4 text-text-muted" />
                  Minha Empresa
                </Link>
                <Link
                  to="/app/config/parametros"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 text-text-muted" />
                  Configurações
                </Link>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
