import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types'
import { api } from '../services/api'

const TOKEN_KEY = 'meupdv_token'
const USER_KEY = 'meupdv_current_user'

interface LoginResult {
  ok: boolean
  error?: string
  requiresConfirmation?: boolean
  activeSessions?: number
  maxLicencas?: number
  message?: string
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
          } else {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
          }
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
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
        return { ok: true }
      }
      return { ok: false, error: 'Erro ao fazer login' }
    } catch (err: any) {
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
