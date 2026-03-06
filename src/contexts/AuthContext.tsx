import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types'
import { StorageKeys, getAll, saveAll, generateId } from '../utils/storage'
import { hashPassword, verifyPassword } from '../utils/helpers'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, senha: string) => Promise<{ ok: boolean; error?: string }>
  register: (dados: { nome: string; email: string; senha: string; empresa?: string }) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

function seedDefaultUser() {
  const users = getAll<User>(StorageKeys.USERS)
  if (users.length === 0) {
    // Cria admin padrão
    hashPassword('admin123').then(hash => {
      const admin: User = {
        _id: generateId(),
        nome: 'Administrador',
        email: 'admin@meupdv.com',
        senha: hash,
        role: 'admin',
        ativo: true,
        criadoEm: new Date().toISOString(),
        empresa: {
          nome: 'Minha Empresa',
          cnpj: '',
          telefone: '',
          endereco: '',
          cidade: '',
          estado: '',
        },
      }
      saveAll(StorageKeys.USERS, [admin])
    })
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    seedDefaultUser()
    // Restaurar sessão
    try {
      const saved = localStorage.getItem(StorageKeys.CURRENT_USER)
      if (saved) {
        setUser(JSON.parse(saved))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, senha: string) => {
    const users = getAll<User>(StorageKeys.USERS)
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!found) return { ok: false, error: 'E-mail nao encontrado' }
    if (!found.ativo) return { ok: false, error: 'Usuario inativo' }

    const valid = await verifyPassword(senha, found.senha)
    if (!valid) return { ok: false, error: 'Senha incorreta' }

    // Atualizar ultimo login
    found.ultimoLogin = new Date().toISOString()
    const all = getAll<User>(StorageKeys.USERS)
    const idx = all.findIndex(u => u._id === found._id)
    if (idx !== -1) { all[idx] = found; saveAll(StorageKeys.USERS, all) }

    const userSafe = { ...found, senha: '***' }
    localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(userSafe))
    setUser(userSafe)
    return { ok: true }
  }, [])

  const register = useCallback(async (dados: { nome: string; email: string; senha: string; empresa?: string }) => {
    const users = getAll<User>(StorageKeys.USERS)
    if (users.some(u => u.email.toLowerCase() === dados.email.toLowerCase())) {
      return { ok: false, error: 'E-mail ja cadastrado' }
    }

    const hash = await hashPassword(dados.senha)
    const newUser: User = {
      _id: generateId(),
      nome: dados.nome,
      email: dados.email,
      senha: hash,
      role: 'admin',
      ativo: true,
      criadoEm: new Date().toISOString(),
      empresa: {
        nome: dados.empresa || 'Minha Empresa',
      },
    }
    users.push(newUser)
    saveAll(StorageKeys.USERS, users)

    const userSafe = { ...newUser, senha: '***' }
    localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(userSafe))
    setUser(userSafe)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(StorageKeys.CURRENT_USER)
    setUser(null)
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    if (!user) return
    const users = getAll<User>(StorageKeys.USERS)
    const idx = users.findIndex(u => u._id === user._id)
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates }
      saveAll(StorageKeys.USERS, users)
    }
    const updated = { ...user, ...updates, senha: '***' }
    localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(updated))
    setUser(updated)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
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
