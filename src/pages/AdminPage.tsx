import { useState, useEffect, useCallback } from 'react'
import {
  Shield, LogIn, Users, Building2,
  ToggleLeft, ToggleRight, ChevronLeft,
  Eye, UserCheck, UserX, TrendingUp, Calendar,
  LogOut, AlertCircle, Loader2, Monitor,
  Key, Trash2, X, Wifi, WifiOff,
  Bell, Clock, UserPlus, Unlock,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface Tenant {
  _id: string
  nome: string
  email: string
  empresa?: { nome?: string; cnpj?: string; telefone?: string; cidade?: string; estado?: string }
  ativo: boolean
  criadoEm: string
  ultimoLogin?: string
  subUserCount: number
  activeSessions: number
  maxLicencas: number
  dataVencimento?: string
  statusAssinatura?: string
}

interface SessionInfo {
  _id: string
  userId: string
  userName: string
  userEmail: string
  deviceInfo: string
  ipAddress: string
  criadoEm: string
}

interface TenantDetail extends Omit<Tenant, 'activeSessions'> {
  activeSessions: SessionInfo[]
  subUsers: {
    _id: string
    nome: string
    email: string
    role: string
    ativo: boolean
    criadoEm: string
    ultimoLogin?: string
  }[]
}

interface Stats {
  totalAdmins: number
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalActiveSessions: number
  monthlyRegistrations: { _id: string; count: number }[]
  vencidos: number
  vencendoEm7dias: number
  novosCadastros: number
}

// Separate API helper for admin (doesn't redirect to /login on 401)
async function adminApi(path: string, options?: RequestInit) {
  const token = sessionStorage.getItem('meupdv_admin_token')
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  let data: any
  try {
    data = await res.json()
  } catch {
    throw new Error('Servidor indisponivel. Verifique se o backend esta rodando.')
  }
  if (!res.ok) throw new Error(data.error || 'Erro')
  return data
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatCnpj(cnpj?: string) {
  if (!cnpj) return '—'
  const c = cnpj.replace(/\D/g, '')
  if (c.length !== 14) return cnpj
  return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function parseBrowser(ua: string) {
  if (!ua) return 'Desconhecido'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return ua.substring(0, 40) + '...'
}

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loginError, setLoginError] = useState('')

  const [stats, setStats] = useState<Stats | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Modals
  const [resetPasswordModal, setResetPasswordModal] = useState<{ id: string; nome: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ id: string; nome: string } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [licenseModal, setLicenseModal] = useState<{ id: string; nome: string; current: number } | null>(null)
  const [newLicenseCount, setNewLicenseCount] = useState(1)
  const [licenseLoading, setLicenseLoading] = useState(false)
  const [kickingSession, setKickingSession] = useState<string | null>(null)
  const [vencimentoModal, setVencimentoModal] = useState<{ id: string; nome: string; current?: string } | null>(null)
  const [newVencimento, setNewVencimento] = useState('')
  const [vencimentoLoading, setVencimentoLoading] = useState(false)
  const [desbloqueandoId, setDesbloqueandoId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Check existing session
  useEffect(() => {
    const token = sessionStorage.getItem('meupdv_admin_token')
    if (token) {
      adminApi('/admin/verify')
        .then(() => setAuthenticated(true))
        .catch(() => {
          sessionStorage.removeItem('meupdv_admin_token')
          setAuthenticated(false)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    // Limpar token antigo antes de tentar login
    sessionStorage.removeItem('meupdv_admin_token')
    try {
      // Primeiro tentar login normal
      let loginRes = await adminApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      })

      // Se requer confirmacao de licenca, forcar login (admin sempre tem prioridade)
      if (loginRes.data?.requiresConfirmation) {
        loginRes = await adminApi('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, senha, forceLogin: true }),
        })
      }

      const token = loginRes.data?.token
      if (!token) {
        throw new Error('Resposta de login invalida. Verifique suas credenciais.')
      }

      sessionStorage.setItem('meupdv_admin_token', token)
      await adminApi('/admin/verify')
      setAuthenticated(true)
    } catch (err: any) {
      sessionStorage.removeItem('meupdv_admin_token')
      const msg = err.message || 'Erro desconhecido'
      setLoginError(
        msg === 'Acesso restrito' ? 'Acesso negado. Apenas superadmin.' :
        msg.includes('Token') ? 'Sessao expirada. Tente novamente.' :
        msg
      )
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('meupdv_admin_token')
    setAuthenticated(false)
    setEmail('')
    setSenha('')
  }

  const loadData = useCallback(async () => {
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        adminApi('/admin/stats'),
        adminApi('/admin/tenants'),
      ])
      setStats(statsRes.data)
      setTenants(tenantsRes.data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (authenticated) loadData()
  }, [authenticated, loadData])

  const handleViewTenant = async (id: string) => {
    try {
      const res = await adminApi(`/admin/tenants/${id}`)
      setSelectedTenant(res.data)
      setView('detail')
    } catch {
      // ignore
    }
  }

  const handleToggle = async (id: string) => {
    setTogglingId(id)
    try {
      await adminApi(`/admin/tenants/${id}/toggle`, { method: 'PATCH' })
      await loadData()
      if (selectedTenant?._id === id) {
        const res = await adminApi(`/admin/tenants/${id}`)
        setSelectedTenant(res.data)
      }
      showToast('Status atualizado')
    } catch {
      showToast('Erro ao alterar status', 'err')
    } finally {
      setTogglingId(null)
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordModal || newPassword.length < 6) return
    setResetLoading(true)
    try {
      await adminApi(`/admin/tenants/${resetPasswordModal.id}/reset-password`, {
        method: 'PATCH',
        body: JSON.stringify({ novaSenha: newPassword }),
      })
      showToast('Senha alterada com sucesso')
      setResetPasswordModal(null)
      setNewPassword('')
    } catch (err: any) {
      showToast(err.message || 'Erro ao resetar senha', 'err')
    } finally {
      setResetLoading(false)
    }
  }

  const handleDeleteTenant = async () => {
    if (!deleteModal || deleteConfirmText !== 'EXCLUIR') return
    setDeleteLoading(true)
    try {
      await adminApi(`/admin/tenants/${deleteModal.id}`, { method: 'DELETE' })
      showToast('Tenant excluido com sucesso')
      setDeleteModal(null)
      setDeleteConfirmText('')
      setView('list')
      setSelectedTenant(null)
      await loadData()
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir', 'err')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSetLicenses = async () => {
    if (!licenseModal || newLicenseCount < 1) return
    setLicenseLoading(true)
    try {
      await adminApi(`/admin/tenants/${licenseModal.id}/licenses`, {
        method: 'PATCH',
        body: JSON.stringify({ maxLicencas: newLicenseCount }),
      })
      showToast(`Licencas atualizadas para ${newLicenseCount}`)
      setLicenseModal(null)
      await loadData()
      if (selectedTenant?._id === licenseModal.id) {
        const res = await adminApi(`/admin/tenants/${licenseModal.id}`)
        setSelectedTenant(res.data)
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar licencas', 'err')
    } finally {
      setLicenseLoading(false)
    }
  }

  const handleKickSession = async (sessionId: string) => {
    setKickingSession(sessionId)
    try {
      await adminApi(`/admin/sessions/${sessionId}/kick`, { method: 'POST' })
      showToast('Sessao encerrada')
      if (selectedTenant) {
        const res = await adminApi(`/admin/tenants/${selectedTenant._id}`)
        setSelectedTenant(res.data)
      }
      await loadData()
    } catch (err: any) {
      showToast(err.message || 'Erro ao encerrar sessao', 'err')
    } finally {
      setKickingSession(null)
    }
  }

  const handleSetVencimento = async () => {
    if (!vencimentoModal || !newVencimento) return
    setVencimentoLoading(true)
    try {
      await adminApi(`/admin/tenants/${vencimentoModal.id}/vencimento`, {
        method: 'PATCH',
        body: JSON.stringify({ dataVencimento: newVencimento }),
      })
      showToast('Vencimento atualizado com sucesso')
      setVencimentoModal(null)
      await loadData()
      if (selectedTenant?._id === vencimentoModal.id) {
        const res = await adminApi(`/admin/tenants/${vencimentoModal.id}`)
        setSelectedTenant(res.data)
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar vencimento', 'err')
    } finally {
      setVencimentoLoading(false)
    }
  }

  const handleDesbloquear = async (id: string) => {
    setDesbloqueandoId(id)
    try {
      const res = await adminApi(`/admin/tenants/${id}/desbloquear`, { method: 'PATCH' })
      showToast(res.data?.mensagem || 'Assinatura renovada com sucesso!')
      await loadData()
      if (selectedTenant?._id === id) {
        const detail = await adminApi(`/admin/tenants/${id}`)
        setSelectedTenant(detail.data)
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao desbloquear assinatura', 'err')
    } finally {
      setDesbloqueandoId(null)
    }
  }

  function getVencimentoStatus(dataVencimento?: string) {
    if (!dataVencimento) return { label: 'SEM VENCIMENTO', color: 'bg-gray-500/20 text-gray-400', urgency: 'none' }
    const now = new Date()
    const venc = new Date(dataVencimento)
    const dias = Math.ceil((venc.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    if (dias < 0) return { label: `VENCIDO (${Math.abs(dias)}d)`, color: 'bg-red-500/20 text-red-400', urgency: 'expired' }
    if (dias <= 3) return { label: `VENCE EM ${dias}d`, color: 'bg-red-500/20 text-red-400', urgency: 'critical' }
    if (dias <= 7) return { label: `VENCE EM ${dias}d`, color: 'bg-amber-500/20 text-amber-400', urgency: 'warning' }
    return { label: `${dias}d restantes`, color: 'bg-emerald-500/20 text-emerald-400', urgency: 'ok' }
  }

  const filteredTenants = tenants.filter(t =>
    t.nome.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    (t.empresa?.nome || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }

  // ============ LOGIN SCREEN ============
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
                <Shield size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-400 text-sm mt-1">MeuPDV - Gerenciamento da Plataforma</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {loginError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  placeholder="admin@email.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  placeholder="••••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                {loginLoading ? 'Verificando...' : 'Acessar Painel'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const sessions: SessionInfo[] = selectedTenant?.activeSessions ?? []

  // ============ ADMIN DASHBOARD ============
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-fade-in flex items-center gap-2 ${
          toast.type === 'ok'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">MeuPDV Admin</h1>
              <p className="text-[11px] text-gray-500">Painel de Gerenciamento</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Stats Cards */}
        {stats && (
          <>
            {/* Alert banner for expiring/expired tenants */}
            {(stats.vencidos > 0 || stats.vencendoEm7dias > 0 || stats.novosCadastros > 0) && (
              <div className="flex flex-wrap gap-3 mb-6">
                {stats.novosCadastros > 0 && (
                  <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-3 flex-1 min-w-[200px]">
                    <UserPlus size={20} className="text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-300">{stats.novosCadastros} novo(s) cadastro(s)</p>
                      <p className="text-xs text-blue-400/70">nas ultimas 48 horas</p>
                    </div>
                  </div>
                )}
                {stats.vencendoEm7dias > 0 && (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-3 flex-1 min-w-[200px]">
                    <Clock size={20} className="text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-300">{stats.vencendoEm7dias} assinatura(s) vencendo</p>
                      <p className="text-xs text-amber-400/70">nos proximos 7 dias</p>
                    </div>
                  </div>
                )}
                {stats.vencidos > 0 && (
                  <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-3 flex-1 min-w-[200px]">
                    <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-300">{stats.vencidos} assinatura(s) vencida(s)</p>
                      <p className="text-xs text-red-400/70">necessitam atencao</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Building2 size={16} className="text-violet-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">PDVs</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalAdmins}</p>
                <p className="text-xs text-gray-500 mt-1">contas admin</p>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Users size={16} className="text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Usuarios</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">total</p>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <UserCheck size={16} className="text-emerald-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Ativos</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">{stats.activeUsers}</p>
                <p className="text-xs text-gray-500 mt-1">usuarios ativos</p>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-red-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <UserX size={16} className="text-rose-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Inativos</span>
                </div>
                <p className="text-3xl font-bold text-rose-400">{stats.inactiveUsers}</p>
                <p className="text-xs text-gray-500 mt-1">usuarios inativos</p>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Monitor size={16} className="text-amber-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Sessoes</span>
                </div>
                <p className="text-3xl font-bold text-amber-400">{stats.totalActiveSessions}</p>
                <p className="text-xs text-gray-500 mt-1">sessoes ativas</p>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <UserPlus size={16} className="text-cyan-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Novos</span>
                </div>
                <p className="text-3xl font-bold text-cyan-400">{stats.novosCadastros}</p>
                <p className="text-xs text-gray-500 mt-1">ultimas 48h</p>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Clock size={16} className="text-yellow-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Vencendo</span>
                </div>
                <p className="text-3xl font-bold text-yellow-400">{stats.vencendoEm7dias}</p>
                <p className="text-xs text-gray-500 mt-1">em 7 dias</p>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-rose-500" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Bell size={16} className="text-red-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Vencidos</span>
                </div>
                <p className="text-3xl font-bold text-red-400">{stats.vencidos}</p>
                <p className="text-xs text-gray-500 mt-1">assinaturas</p>
              </div>
            </div>
          </>
        )}

        {/* Monthly registrations */}
        {stats && stats.monthlyRegistrations.length > 0 && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <TrendingUp size={16} className="text-violet-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-300">Novos PDVs por Mes</h3>
              </div>
              <span className="text-xs text-gray-600">Ultimos 6 meses</span>
            </div>
            <div className="space-y-3">
              {stats.monthlyRegistrations.map(m => {
                const max = Math.max(...stats.monthlyRegistrations.map(x => x.count))
                const width = max > 0 ? (m.count / max) * 100 : 0
                const [year, month] = m._id.split('-')
                const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                const label = `${monthNames[parseInt(month)]} ${year}`
                return (
                  <div key={m._id} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-400 w-20 text-right">{label}</span>
                    <div className="flex-1 h-8 bg-gray-800/50 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                        style={{ width: `${Math.max(8, width)}%` }}
                      >
                        {width >= 20 && (
                          <span className="text-xs font-bold text-white">{m.count}</span>
                        )}
                      </div>
                      {width < 20 && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-violet-400">{m.count}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tenants List / Detail */}
        {view === 'list' ? (
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Building2 size={16} className="text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-300">PDVs Cadastrados ({tenants.length})</h3>
              </div>
              <input
                type="text"
                placeholder="Buscar por nome, email ou empresa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 w-72"
              />
            </div>

            <div className="divide-y divide-gray-800/60">
              {filteredTenants.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">Nenhum resultado encontrado</div>
              ) : (
                filteredTenants.map(t => (
                  <div key={t._id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-800/30 transition-colors">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      t.ativo ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white' : 'bg-gray-800 text-gray-600'
                    }`}>
                      {t.nome.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{t.nome}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          t.ativo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {t.ativo ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{t.email}</p>
                      {t.empresa?.nome && (
                        <p className="text-xs text-gray-600 truncate mt-0.5">{t.empresa.nome}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-xs text-gray-500">
                      <div className="text-center">
                        <p className="font-bold text-gray-300">{t.subUserCount}</p>
                        <p>usuarios</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-bold ${t.activeSessions > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>
                          {t.activeSessions}/{t.maxLicencas}
                        </p>
                        <p>sessoes/lic.</p>
                      </div>
                      <div className="text-center">
                        {(() => {
                          const vs = getVencimentoStatus(t.dataVencimento)
                          return (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${vs.color}`}>
                              {vs.label}
                            </span>
                          )
                        })()}
                        <p>vencimento</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-400">{formatDate(t.criadoEm).split(',')[0]}</p>
                        <p>registro</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setLicenseModal({ id: t._id, nome: t.nome, current: t.maxLicencas })
                          setNewLicenseCount(t.maxLicencas)
                        }}
                        className="p-2 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
                        title="Licencas"
                      >
                        <Monitor size={17} />
                      </button>
                      <button
                        onClick={() => handleToggle(t._id)}
                        disabled={togglingId === t._id}
                        className={`p-2 rounded-lg transition-colors ${
                          t.ativo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-600 hover:bg-gray-700'
                        }`}
                        title={t.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {togglingId === t._id ? <Loader2 size={17} className="animate-spin" /> :
                          t.ativo ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                      </button>
                      <button
                        onClick={() => handleViewTenant(t._id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteModal({ id: t._id, nome: t.nome })
                          setDeleteConfirmText('')
                        }}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Excluir empresa"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* ============ TENANT DETAIL ============ */
          selectedTenant && (
            <div className="space-y-5">
              <button
                onClick={() => { setView('list'); setSelectedTenant(null) }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} /> Voltar para lista
              </button>

              {/* Tenant header */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                    selectedTenant.ativo ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white' : 'bg-gray-800 text-gray-600'
                  }`}>
                    {selectedTenant.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-white">{selectedTenant.nome}</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        selectedTenant.ativo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedTenant.ativo ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{selectedTenant.email}</p>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Botão Desbloquear — aparece somente quando assinatura vencida */}
                    {(() => {
                      const vs = getVencimentoStatus((selectedTenant as any).dataVencimento)
                      return vs.urgency === 'expired' ? (
                        <button
                          onClick={() => handleDesbloquear(selectedTenant._id)}
                          disabled={desbloqueandoId === selectedTenant._id}
                          className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                          title="Renova +30 dias a partir do vencimento original"
                        >
                          {desbloqueandoId === selectedTenant._id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Unlock size={14} />}
                          Desbloquear
                        </button>
                      ) : null
                    })()}
                    <button
                      onClick={() => {
                        setVencimentoModal({ id: selectedTenant._id, nome: selectedTenant.nome, current: (selectedTenant as any).dataVencimento })
                        setNewVencimento((selectedTenant as any).dataVencimento ? new Date((selectedTenant as any).dataVencimento).toISOString().split('T')[0] : '')
                      }}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                        (() => {
                          const vs = getVencimentoStatus((selectedTenant as any).dataVencimento)
                          return vs.urgency === 'expired' || vs.urgency === 'critical'
                            ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                            : vs.urgency === 'warning'
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                        })()
                      }`}
                    >
                      <Calendar size={14} /> Vencimento
                    </button>
                    <button
                      onClick={() => {
                        setLicenseModal({ id: selectedTenant._id, nome: selectedTenant.nome, current: selectedTenant.maxLicencas })
                        setNewLicenseCount(selectedTenant.maxLicencas)
                      }}
                      className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all"
                    >
                      <Monitor size={14} /> {selectedTenant.maxLicencas} Lic.
                    </button>
                    <button
                      onClick={() => {
                        setResetPasswordModal({ id: selectedTenant._id, nome: selectedTenant.nome })
                        setNewPassword('')
                      }}
                      className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all"
                    >
                      <Key size={14} /> Resetar Senha
                    </button>
                    <button
                      onClick={() => handleToggle(selectedTenant._id)}
                      disabled={togglingId === selectedTenant._id}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                        selectedTenant.ativo
                          ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {togglingId === selectedTenant._id ? <Loader2 size={14} className="animate-spin" /> :
                        selectedTenant.ativo ? <><ToggleLeft size={14} /> Desativar</> : <><ToggleRight size={14} /> Ativar</>}
                    </button>
                    <button
                      onClick={() => {
                        setDeleteModal({ id: selectedTenant._id, nome: selectedTenant.nome })
                        setDeleteConfirmText('')
                      }}
                      className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  </div>
                </div>
              </div>

              {/* Company info + Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <Building2 size={16} className="text-violet-400" /> Dados da Empresa
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Empresa</span>
                      <span className="text-gray-300 font-medium">{selectedTenant.empresa?.nome || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CNPJ</span>
                      <span className="text-gray-300 font-medium">{formatCnpj(selectedTenant.empresa?.cnpj)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Telefone</span>
                      <span className="text-gray-300 font-medium">{selectedTenant.empresa?.telefone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cidade/UF</span>
                      <span className="text-gray-300 font-medium">
                        {selectedTenant.empresa?.cidade ? `${selectedTenant.empresa.cidade}/${selectedTenant.empresa.estado}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-violet-400" /> Informacoes
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data de Registro</span>
                      <span className="text-gray-300 font-medium">{formatDate(selectedTenant.criadoEm)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ultimo Login</span>
                      <span className="text-gray-300 font-medium">{formatDate(selectedTenant.ultimoLogin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sub-usuarios</span>
                      <span className="text-gray-300 font-medium">{selectedTenant.subUsers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Licencas (max PDVs)</span>
                      <span className="text-amber-400 font-bold">{selectedTenant.maxLicencas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sessoes ativas</span>
                      <span className={`font-bold ${sessions.length > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>
                        {sessions.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Vencimento</span>
                      <div className="flex items-center gap-2">
                        {(selectedTenant as any).dataVencimento ? (
                          <>
                            <span className="text-gray-300 font-medium">
                              {formatDate((selectedTenant as any).dataVencimento).split(',')[0]}
                            </span>
                            {(() => {
                              const vs = getVencimentoStatus((selectedTenant as any).dataVencimento)
                              return (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${vs.color}`}>
                                  {vs.label}
                                </span>
                              )
                            })()}
                          </>
                        ) : (
                          <span className="text-gray-600">Nao definido</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                    <Wifi size={16} className="text-emerald-400" /> Sessoes Ativas ({sessions.length})
                  </h3>
                </div>
                {sessions.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-600 text-sm flex flex-col items-center gap-2">
                    <WifiOff size={24} className="text-gray-700" />
                    Nenhuma sessao ativa
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800/60">
                    {sessions.map(s => (
                      <div key={s._id} className="px-6 py-3 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <Monitor size={14} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-300 truncate">
                            {s.userName} <span className="text-gray-600">({s.userEmail})</span>
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {parseBrowser(s.deviceInfo)} &middot; IP: {s.ipAddress || '—'} &middot; {formatDate(s.criadoEm)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleKickSession(s._id)}
                          disabled={kickingSession === s._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
                        >
                          {kickingSession === s._id ? <Loader2 size={12} className="animate-spin" /> : <WifiOff size={12} />}
                          Encerrar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-users */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                    <Users size={16} className="text-violet-400" /> Usuarios ({selectedTenant.subUsers.length})
                  </h3>
                </div>
                {selectedTenant.subUsers.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-600 text-sm">Nenhum sub-usuario cadastrado</div>
                ) : (
                  <div className="divide-y divide-gray-800/60">
                    {selectedTenant.subUsers.map(u => (
                      <div key={u._id} className="px-6 py-3 flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          u.ativo ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-600'
                        }`}>
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-300 truncate">{u.nome}</p>
                          <p className="text-xs text-gray-600">{u.email}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          u.role === 'gerente' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          u.ativo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {u.ativo ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* ============ MODALS ============ */}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key size={20} className="text-blue-400" /> Resetar Senha
              </h3>
              <button onClick={() => setResetPasswordModal(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Definir nova senha para <span className="font-semibold text-white">{resetPasswordModal.nome}</span>
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Nova senha (min. 6 caracteres)"
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setResetPasswordModal(null)}
                className="flex-1 px-4 py-3 border border-gray-700 rounded-xl font-semibold text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetLoading || newPassword.length < 6}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetLoading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tenant Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <Trash2 size={20} /> Excluir Tenant
              </h3>
              <button onClick={() => setDeleteModal(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-300 font-medium mb-1">Esta acao e irreversivel!</p>
              <p className="text-xs text-red-400/80">
                Todos os dados serao excluidos: usuarios, produtos, vendas, clientes, financeiro, sessoes e mais.
              </p>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Para confirmar, digite <span className="font-bold text-red-400">EXCLUIR</span> abaixo:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-3 border border-gray-700 rounded-xl font-semibold text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTenant}
                disabled={deleteLoading || deleteConfirmText !== 'EXCLUIR'}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Excluir Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License Modal */}
      {licenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Monitor size={20} className="text-amber-400" /> Licencas (PDVs)
              </h3>
              <button onClick={() => setLicenseModal(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-2">
              Definir quantidade de PDVs simultaneos para <span className="font-semibold text-white">{licenseModal.nome}</span>
            </p>
            <p className="text-xs text-gray-600 mb-4">
              Atual: {licenseModal.current} licenca(s)
            </p>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setNewLicenseCount(Math.max(1, newLicenseCount - 1))}
                className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 text-white font-bold text-xl hover:bg-gray-700 transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <p className="text-4xl font-bold text-amber-400">{newLicenseCount}</p>
                <p className="text-xs text-gray-500 mt-1">PDV(s) simultaneo(s)</p>
              </div>
              <button
                onClick={() => setNewLicenseCount(newLicenseCount + 1)}
                className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 text-white font-bold text-xl hover:bg-gray-700 transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setLicenseModal(null)}
                className="flex-1 px-4 py-3 border border-gray-700 rounded-xl font-semibold text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSetLicenses}
                disabled={licenseLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {licenseLoading ? <Loader2 size={16} className="animate-spin" /> : <Monitor size={16} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Vencimento Modal */}
      {vencimentoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar size={20} className="text-cyan-400" /> Data de Vencimento
              </h3>
              <button onClick={() => setVencimentoModal(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-2">
              Definir vencimento da assinatura de <span className="font-semibold text-white">{vencimentoModal.nome}</span>
            </p>
            {vencimentoModal.current && (
              <p className="text-xs text-gray-600 mb-4">
                Atual: {formatDate(vencimentoModal.current).split(',')[0]}
              </p>
            )}
            <input
              type="date"
              value={newVencimento}
              onChange={e => setNewVencimento(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all mb-2"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {[7, 15, 30, 60, 90, 365].map(dias => (
                <button
                  key={dias}
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() + dias)
                    setNewVencimento(d.toISOString().split('T')[0])
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-cyan-500/50 transition-all"
                >
                  +{dias}d
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setVencimentoModal(null)}
                className="flex-1 px-4 py-3 border border-gray-700 rounded-xl font-semibold text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSetVencimento}
                disabled={vencimentoLoading || !newVencimento}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {vencimentoLoading ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
