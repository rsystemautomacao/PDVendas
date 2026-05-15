import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types'
import { api } from '../services/api'
import { StorageKeys } from '../utils/storage'
import { salvarConfig } from '../utils/offlineDb'

const TOKEN_KEY = StorageKeys.TOKEN
const USER_KEY = StorageKeys.CURRENT_USER
const OFFLINE_CRED_KEY = 'meupdv_offline_cred'

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
      api.get('/auth/me')
        .then(res => {
          if (res.success && res.data) {
            setUser(res.data)
            localStorage.setItem(USER_KEY, JSON.stringify(res.data))
            // OFFLINE: cachear dados do usuario/empresa no IndexedDB
            salvarConfig('usuario', res.data).catch(() => {})
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
        // OFFLINE: Cachear credenciais (hash) para login offline futuro
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
        const credValida = await validarCredenciaisOffline(email, senha)
        if (credValida) {
          const cached = localStorage.getItem(USER_KEY)
          if (cached) {
            try {
              const userData = JSON.parse(cached)
              setUser(userData)
              return { ok: true, offline: true }
            } catch { /* cache corrompido */ }
          }
        }
        return {
          ok: false,
          error: credValida
            ? 'Dados do usuario nao encontrados no cache. Conecte-se a internet pelo menos uma vez.'
            : 'Sem conexao com o servidor. Verifique sua internet.',
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
