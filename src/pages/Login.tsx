import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertTriangle, Monitor, ArrowRight, Sparkles, Eye, EyeOff, User, ShieldCheck } from 'lucide-react'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { clearAllCaches } from '../utils/cacheUtils'

const PROMO_TITLE = 'Chega de planilhas e anotações!'
const PROMO_TEXT = 'Controle suas vendas, estoque e financeiro de forma simples e centralizada.'

const disconnectMessages: Record<string, string> = {
  license_exceeded: 'Você foi desconectado porque outro dispositivo fez login e o limite de licenças foi atingido.',
  admin_blocked: 'Sua conta foi desativada pelo administrador.',
  admin_kicked: 'Sua sessão foi encerrada pelo administrador.',
  admin_deleted: 'Sua conta foi removida do sistema.',
}

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slowConnection, setSlowConnection] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [disconnectMsg, setDisconnectMsg] = useState('')

  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [licenseInfo, setLicenseInfo] = useState<{ activeSessions: number; maxLicencas: number; message: string } | null>(null)
  const [showNotFoundModal, setShowNotFoundModal] = useState(false)

  // Force cache clear once per day on login page
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastClear = localStorage.getItem('meupdv_last_cache_clear')
    if (lastClear !== today) {
      localStorage.setItem('meupdv_last_cache_clear', today)
      clearAllCaches()
        .then(() => window.location.reload())
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    const reason = sessionStorage.getItem('meupdv_disconnect_reason')
    if (reason) {
      setDisconnectMsg(disconnectMessages[reason] || 'Sua sessão foi encerrada.')
      sessionStorage.removeItem('meupdv_disconnect_reason')
    }
  }, [])

  const validate = () => {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) next.email = 'E-mail é obrigatório'
    if (!password) next.password = 'Senha é obrigatória'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const doLogin = async (force: boolean) => {
    setLoading(true)
    setSlowConnection(false)
    const slowTimer = setTimeout(() => setSlowConnection(true), 5000)
    try {
      const result = await login(email.trim(), password, force)
      if (result.ok) {
        toast.sucesso('Login realizado com sucesso!')
        navigate('/app', { replace: true })
      } else if (result.requiresConfirmation) {
        setLicenseInfo({
          activeSessions: result.activeSessions || 0,
          maxLicencas: result.maxLicencas || 1,
          message: result.message || '',
        })
        setShowLicenseModal(true)
      } else if (result.error?.includes('Nenhuma conta encontrada')) {
        setShowNotFoundModal(true)
      } else {
        setErrors({ email: result.error })
        toast.erro(result.error || 'Erro ao fazer login')
      }
    } catch {
      toast.erro('Erro inesperado. Tente novamente.')
    } finally {
      clearTimeout(slowTimer)
      setLoading(false)
      setSlowConnection(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await doLogin(false)
  }

  const handleForceLogin = async () => {
    setShowLicenseModal(false)
    await doLogin(true)
  }

  return (
    <AuthSplitLayout
      align="right"
      promoTitle={PROMO_TITLE}
      promoText={PROMO_TEXT}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-28 w-28 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary via-indigo-600 to-violet-700 text-white shadow-2xl shadow-primary/30">
            <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {/* Monitor */}
              <rect x="8" y="12" width="20" height="14" rx="2" />
              <line x1="14" y1="26" x2="14" y2="30" />
              <line x1="22" y1="26" x2="22" y2="30" />
              {/* Caixa registradora body */}
              <rect x="6" y="30" width="52" height="16" rx="3" />
              {/* Gaveta */}
              <line x1="14" y1="38" x2="34" y2="38" />
              <circle cx="48" cy="38" r="2.5" />
              {/* Teclado */}
              <rect x="36" y="20" width="18" height="10" rx="2" />
              <line x1="40" y1="23" x2="40" y2="23.01" strokeWidth="2.5" />
              <line x1="46" y1="23" x2="46" y2="23.01" strokeWidth="2.5" />
              <line x1="50" y1="23" x2="50" y2="23.01" strokeWidth="2.5" />
              <line x1="40" y1="27" x2="40" y2="27.01" strokeWidth="2.5" />
              <line x1="46" y1="27" x2="46" y2="27.01" strokeWidth="2.5" />
              <line x1="50" y1="27" x2="50" y2="27.01" strokeWidth="2.5" />
              {/* Recibo */}
              <path d="M30 20V8c0-1 .5-2 1.5-2h14c1 0 1.5 1 1.5 2v12" />
              <line x1="34" y1="10" x2="44" y2="10" />
              <line x1="34" y1="13.5" x2="42" y2="13.5" />
              <line x1="34" y1="17" x2="40" y2="17" />
              {/* Borda ondulada do recibo */}
              <path d="M30 8c.5-.5 1 .5 1.5 0s1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0" />
              {/* Base */}
              <line x1="6" y1="50" x2="58" y2="50" strokeWidth="2" />
              <line x1="10" y1="46" x2="10" y2="50" />
              <line x1="54" y1="46" x2="54" y2="50" />
            </svg>
          </div>
          <h1 className="text-7xl font-black tracking-tight text-center">
            <span className="text-primary">MEU</span>
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"> PDV</span>
          </h1>
          <p className="text-xs font-bold tracking-[0.25em] text-gray-400 uppercase">
            Sistema de Gestao Comercial
          </p>
        </div>

        {/* Welcome text */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Acesse sua conta</h2>
          <p className="text-sm text-gray-400 mt-1">Insira suas credenciais para continuar</p>
        </div>

        {/* Disconnect notification */}
        {disconnectMsg && (
          <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl px-4 py-3 text-amber-800 text-sm animate-fade-in">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">Sessao encerrada</p>
              <p className="text-amber-700/90 mt-0.5 leading-relaxed text-xs">{disconnectMsg}</p>
            </div>
          </div>
        )}

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">E-mail</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={17} />
              </div>
              <input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setErrors(prev => ({ ...prev, email: undefined }))
                }}
                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl text-gray-800 placeholder-gray-300 text-sm transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 hover:border-gray-300 ${
                  errors.email ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                }`}
                placeholder="seu@email.com"
                autoComplete="username email"
                autoFocus
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500">Senha</label>
              <Link
                to="/forgot"
                className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={17} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })) }}
                className={`w-full pl-11 pr-12 py-3 bg-white border rounded-xl text-gray-800 placeholder-gray-300 text-sm transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 hover:border-gray-300 ${
                  errors.password ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                }`}
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errors.password}</p>}
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <div className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {slowConnection ? 'Conectando ao servidor...' : 'Entrando...'}
              </>
            ) : (
              <>
                Entrar <ArrowRight size={17} />
              </>
            )}
          </button>

          {loading && slowConnection && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 animate-fade-in">
              <p className="font-semibold text-amber-800">Primeiro acesso do dia</p>
              <p className="mt-0.5">O servidor estava em modo de economia. Pode levar ate 1 minuto.</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Register CTA */}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="w-full py-3.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl transition-all duration-200 hover:bg-gray-50 hover:border-primary/30 hover:text-primary hover:shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
        >
          <Sparkles size={16} /> Criar nova conta gratis
        </button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-2">
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-green-500" />
            Conexao segura
          </span>
          <span className="text-gray-200">|</span>
          <a
            href="https://wa.me/5511943950503"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Suporte
          </a>
        </div>
      </form>

      {/* Account not found modal */}
      {showNotFoundModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-scale-in">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/30">
              <User size={26} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Conta nao encontrada</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Nao existe conta cadastrada com <span className="font-bold text-gray-700">{email.trim()}</span>. Deseja criar uma nova?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNotFoundModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.98] text-sm"
              >
                Voltar
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles size={16} /> Criar conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License limit modal */}
      {showLicenseModal && licenseInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-scale-in">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/30">
              <Monitor size={26} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Limite de Licencas</h2>
            <p className="text-gray-500 text-sm mb-2 leading-relaxed">
              Voce possui <span className="font-bold text-gray-700">{licenseInfo.activeSessions}</span> sessao(oes) ativa(s)
              de um maximo de <span className="font-bold text-gray-700">{licenseInfo.maxLicencas}</span> licenca(s).
            </p>
            <div className="bg-amber-50 border border-amber-200/80 rounded-lg px-4 py-3 mb-6">
              <p className="text-amber-700 text-xs font-semibold">
                Ao continuar, a sessao mais antiga sera desconectada automaticamente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLicenseModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.98] text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleForceLogin}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-[0.98] text-sm"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthSplitLayout>
  )
}
