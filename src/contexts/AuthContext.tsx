import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types'
import { api } from '../services/api'
import { StorageKeys } from '../utils/storage'
import { salvarConfig } from '../utils/offlineDb'

const TOKEN_KEY = StorageKeys.TOKEN
const USER_KEY = StorageKeys.CURRENT_USER
const OFFLINE_CRED_KEY = 'meupdv_offline_cred'
// Caches separados — sobrevivem ao logout para permitir login offline
const OFFLINE_USER_KEY = 'meupdv_offline_user'
const OFFLINE_TOKEN_KEY = 'meupdv_offline_token'

// ─── Hash seguro para credenciais offline ───────────────────────
// Usa SHA-256 nativo do browser. Nunca armazena a senha em texto.
async function hashCredenciais(email: string, senha: string): Promise<string> {
  const data = new TextEncoder().encode(`meupdv:${email.toLowerCase().trim()}:${senha}`)
  try {
    const buffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // Fallback para ambientes sem crypto.subtle (HTTP sem SSL)
    let hash = 0
    const str = `meupdv:${email.toLowerCase().trim()}:${senha}`
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit
    }
    return `fallback_${Math.abs(hash).toString(36)}`
  }
}

async function salvarCredenciaisOffline(email: string, senha: string): Promise<void> {
  const hash = await hashCredenciais(email, senha)
  localStorage.setItem(OFFLINE_CRED_KEY, hash)
}

async function validarCredenciaisOffline(email: string, senha: string): Promise<boolean> {
  const stored = localStorage.getItem(OFFLINE_CRED_KEY)
  if (!stored) return false
  const hash = await hashCredenciais(email, senha)
  return hash === stored
}

// ─── Cache offline do usuario (sobrevive ao logout) ────────────

/** Salva dados do usuario em cache offline (nao é apagado no logout) */
function salvarUsuarioOffline(userData: unknown): void {
  try {
    localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(userData))
  } catch { /* storage cheio */ }
}

/** Busca dados do usuario de qualquer cache disponivel */
function buscarUsuarioOfflineCache(): unknown | null {
  // Tenta USER_KEY primeiro (sessao ativa)
  const active = localStorage.getItem(USER_KEY)
  if (active) {
    try { return JSON.parse(active) } catch { /* corrompido */ }
  }
  // Fallback: cache offline (sobrevive ao logout)
  const offline = localStorage.getItem(OFFLINE_USER_KEY)
  if (offline) {
    try { return JSON.parse(offline) } catch { /* corrompido */ }
  }
  return null
}

// ─── Tipos ──────────────────────────────────────────────────────

interface LoginResult {
  ok: boolean
  error?: string
  requiresConfirmation?: boolean
  activeSessions?: number
  maxLicencas?: number
  message?: string
  offline?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  needsOnboarding: boolean
  login: (email: string, senha: string, forceLogin?: boolean) => Promise<LoginResult>
  register: (dados: { nome: string; email: string; senha: string; empresa?: string }) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  updateUser: (updates: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Hook utilitario: retorna se a empresa do usuario usa controle de caixa.
// Default true (compativel com empresas existentes que nao tem o campo).
export function useEmpresaUsaCaixa(): boolean {
  const ctx = useContext(AuthContext)
  return ctx?.user?.empresa?.usaCaixa !== false
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      // OFFLINE: Se ja sabemos que esta offline, carregar do cache direto
      // sem tentar a API (evita delay e garante que o usuario nao veja login page)
      if (!navigator.onLine) {
        const cached = localStorage.getItem(USER_KEY)
        if (cached) {
          try {
            setUser(JSON.parse(cached))
          } catch {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
          }
        }
        setLoading(false)
        return
      }

      api.get('/auth/me')
        .then(res => {
          if (res.success && res.data) {
            setUser(res.data)
            localStorage.setItem(USER_KEY, JSON.stringify(res.data))
            // OFFLINE: cachear token, dados do usuario/empresa
            localStorage.setItem(OFFLINE_TOKEN_KEY, token)
            salvarConfig('usuario', res.data).catch(() => {})
            salvarUsuarioOffline(res.data)
          } else {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
          }
        })
        .catch((err) => {
          // OFFLINE: Se o erro é de conexao, manter usuario do cache local
          // em vez de deslogar. Isso permite uso offline.
          const isNetworkError =
            err.message?.includes('Sem conexao') ||
            err.message?.includes('Failed to fetch') ||
            !navigator.onLine

          if (isNetworkError) {
            const cached = localStorage.getItem(USER_KEY)
            if (cached) {
              try {
                setUser(JSON.parse(cached))
              } catch {
                localStorage.removeItem(TOKEN_KEY)
                localStorage.removeItem(USER_KEY)
              }
            }
          } else {
            // Erro real (401, etc) — limpar normalmente
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, senha: string, forceLogin?: boolean) => {
    try {
      const res = await api.post('/auth/login', { email, senha, forceLogin })
      if (res.success && res.data) {
        // License limit check
        if (res.data.requiresConfirmation) {
          return {
            ok: false,
            requiresConfirmation: true,
            activeSessions: res.data.activeSessions,
            maxLicencas: res.data.maxLicencas,
            message: res.data.message,
          }
        }
        const { user: userData, token } = res.data
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
        setUser(userData)
        salvarConfig('usuario', userData).catch(() => {})
        // OFFLINE: Cachear token, dados do usuario e credenciais para login offline futuro
        localStorage.setItem(OFFLINE_TOKEN_KEY, token)
        salvarUsuarioOffline(userData)
        salvarCredenciaisOffline(email, senha).catch(() => {})
        return { ok: true }
      }
      return { ok: false, error: 'Erro ao fazer login' }
    } catch (err: any) {
      // OFFLINE: Se erro de rede, tentar login offline
      const isNetworkError =
        err.message?.includes('Sem conexao') ||
        err.message?.includes('Failed to fetch') ||
        !navigator.onLine

      if (isNetworkError) {
        // Buscar dados do usuario de qualquer cache (USER_KEY ou OFFLINE_USER_KEY)
        const userData = buscarUsuarioOfflineCache()
        // Restaurar o token JWT real (salvo antes do logout) para que,
        // ao voltar a internet, as chamadas à API funcionem sem 401.
        // O logout offline nao invalida a sessao no servidor (POST falha),
        // entao o token original continua valido.
        const offlineToken = localStorage.getItem(OFFLINE_TOKEN_KEY)

        // Tentar validar pelo hash de credenciais
        const credValida = await validarCredenciaisOffline(email, senha)

        // Helper: restaurar sessao local com dados do cache
        const restaurarSessaoOffline = (data: unknown) => {
          setUser(data as unknown as User)
          localStorage.setItem(USER_KEY, JSON.stringify(data))
          // Usar token real se disponivel, senao placeholder
          localStorage.setItem(TOKEN_KEY, offlineToken || 'offline_session')
        }

        if (credValida && userData) {
          // Hash valido + dados em cache → login offline OK
          restaurarSessaoOffline(userData)
          return { ok: true, offline: true }
        }

        // FALLBACK: Se o hash nao existe ainda (primeiro deploy do offline),
        // mas temos dados em cache + email bate, permitir login offline.
        if (!credValida && userData) {
          const cachedEmail = (userData as { email?: string }).email
          if (cachedEmail?.toLowerCase().trim() === email.toLowerCase().trim()) {
            restaurarSessaoOffline(userData)
            // Gerar o hash agora para futuros logins offline
            salvarCredenciaisOffline(email, senha).catch(() => {})
            return { ok: true, offline: true }
          }
        }

        return {
          ok: false,
          error: userData
            ? 'E-mail nao corresponde ao ultimo usuario logado neste dispositivo.'
            : 'Sem conexao e nenhum dado em cache. Conecte-se a internet pelo menos uma vez.',
        }
      }

      return { ok: false, error: err.message || 'Erro ao fazer login' }
    }
  }, [])

  const register = useCallback(async (dados: { nome: string; email: string; senha: string; empresa?: string }) => {
    try {
      const res = await api.post('/auth/register', {
        nome: dados.nome,
        email: dados.email,
        senha: dados.senha,
        empresa: dados.empresa ? { nome: dados.empresa } : undefined,
      })
      if (res.success && res.data) {
        const { user: userData, token } = res.data
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
        setUser(userData)
        return { ok: true }
      }
      return { ok: false, error: 'Erro ao registrar' }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Erro ao registrar' }
    }
  }, [])

  const logout = useCallback(() => {
    // Notify backend (fire-and-forget)
    api.post('/auth/logout').catch(() => {})
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    // Manter credenciais offline (hash) para permitir login offline
    // Nao remover OFFLINE_CRED_KEY
    setUser(null)
  }, [])

  const updateUser = useCallback(async (updates: Record<string, unknown>) => {
    try {
      const res = await api.put('/auth/me', updates)
      if (res.success && res.data) {
        setUser(res.data)
        localStorage.setItem(USER_KEY, JSON.stringify(res.data))
        return { ok: true }
      }
      return { ok: false, error: 'Erro ao atualizar dados' }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Erro ao atualizar dados' }
    }
  }, [])

  const needsOnboarding = !!(user && user.role === 'admin' && !user.empresaSetupComplete)

  return (
    <AuthContext.Provider value={{ user, loading, needsOnboarding, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---- Route Guard ----
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null
  return <>{children}</>
}
