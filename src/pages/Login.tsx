import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Lock, AlertTriangle, Monitor, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { LoginBear, useLoginBear } from '../components/LoginBear'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

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
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [disconnectMsg, setDisconnectMsg] = useState('')

  // Bear mascot
  const bear = useLoginBear()

  // License confirmation modal
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [licenseInfo, setLicenseInfo] = useState<{ activeSessions: number; maxLicencas: number; message: string } | null>(null)

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
      } else {
        setErrors({ email: result.error })
        toast.erro(result.error || 'Erro ao fazer login')
      }
    } catch {
      toast.erro('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-700 text-white shadow-lg shadow-primary/30">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-primary to-indigo-800 bg-clip-text text-transparent">
              MeuPDV
            </h1>
            <p className="text-[11px] font-semibold tracking-[0.15em] text-gray-400 mt-0.5">
              CONTROLE DE ESTOQUE, VENDAS E FINANCEIRO
            </p>
          </div>
        </div>

        {/* Bear mascot */}
        <div className="flex justify-center -mb-2">
          <LoginBear state={bear.bearState} lookAt={bear.lookAt} />
        </div>

        {/* Welcome text */}
        <div className="text-center -mt-1">
          <h2 className="text-lg font-bold text-gray-800">Bem-vindo de volta</h2>
          <p className="text-sm text-gray-500 mt-0.5">Entre na sua conta para continuar</p>
        </div>

        {/* Disconnect notification */}
        {disconnectMsg && (
          <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl px-4 py-3.5 text-amber-800 text-sm animate-fade-in shadow-sm">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">Sessão encerrada</p>
              <p className="text-amber-700/90 mt-0.5 leading-relaxed">{disconnectMsg}</p>
            </div>
          </div>
        )}

        {/* Fields */}
        <div className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">E-mail</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </div>
              <input
                ref={bear.emailRef}
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setErrors(prev => ({ ...prev, email: undefined }))
                  bear.onEmailChange(e.target.value)
                }}
                onFocus={bear.onEmailFocus}
                onBlur={bear.onFieldBlur}
                className={`w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border rounded-2xl text-gray-800 placeholder-gray-400 text-sm transition-all duration-200 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 focus:shadow-lg focus:shadow-primary/5 hover:border-gray-300 ${
                  errors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                }`}
                placeholder="seu@email.com"
                autoComplete="username email"
                autoFocus
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Senha</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                ref={bear.passwordRef}
                type={bear.passwordVisible ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })) }}
                onFocus={bear.onPasswordFocus}
                onBlur={bear.onFieldBlur}
                className={`w-full pl-11 pr-12 py-3.5 bg-gray-50/80 border rounded-2xl text-gray-800 placeholder-gray-400 text-sm transition-all duration-200 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 focus:shadow-lg focus:shadow-primary/5 hover:border-gray-300 ${
                  errors.password ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                }`}
                placeholder="Sua senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={bear.togglePasswordVisibility}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={bear.passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {bear.passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errors.password}</p>}
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot"
              className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors hover:underline decoration-2 underline-offset-2"
            >
              Esqueci a senha
            </Link>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-2 text-[15px]"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Entrar <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="relative flex items-center gap-4 my-1">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-xs text-gray-400 font-medium">Ainda não tem uma conta?</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          <button
            type="button"
            onClick={() => navigate('/register')}
            className="w-full py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl transition-all duration-200 hover:bg-gray-50 hover:border-primary/30 hover:text-primary hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-[15px]"
          >
            <Sparkles size={18} /> Criar nova conta
          </button>
        </div>

        <footer className="mt-1 flex flex-col items-center gap-1 text-center text-sm">
          <span className="text-gray-400 text-xs">Precisa de ajuda?</span>
          <a
            href="https://wa.me/5511943950503"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline decoration-2 underline-offset-2 transition-colors"
          >
            Fale conosco
          </a>
        </footer>
      </form>

      {/* License limit modal */}
      {showLicenseModal && licenseInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-scale-in">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/30">
              <Monitor size={30} className="text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-2">Limite de Licenças</h2>
            <p className="text-gray-500 mb-2 leading-relaxed">
              Você possui <span className="font-bold text-gray-800">{licenseInfo.activeSessions}</span> sessão(ões) ativa(s)
              de um máximo de <span className="font-bold text-gray-800">{licenseInfo.maxLicencas}</span> licença(s).
            </p>
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3 mb-6">
              <p className="text-amber-700 text-sm font-semibold">
                Ao continuar, a sessão mais antiga será desconectada automaticamente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLicenseModal(false)}
                className="flex-1 px-4 py-3.5 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                onClick={handleForceLogin}
                className="flex-1 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl active:scale-[0.98]"
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
