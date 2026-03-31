import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { LogoMeuPDV } from '../components/LogoMeuPDV'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'

const PROMO_TITLE = 'Chega de planilhas e anotacoes!'
const PROMO_TEXT = 'Controle suas vendas, estoque e financeiro de forma simples e centralizada.'

export function ForgotPassword() {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!email.trim()) next.email = 'Email e obrigatorio'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() })
      if (res.success && res.data?.token) {
        setResetCode(res.data.token)
        setStep(2)
        toast.sucesso('Codigo gerado! Anote o codigo abaixo.')
      } else {
        toast.info('Se o email existir, um codigo sera gerado.')
        setStep(2)
      }
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao solicitar reset')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!token.trim()) next.token = 'Codigo e obrigatorio'
    if (token.trim().length !== 6) next.token = 'Codigo deve ter 6 digitos'
    if (!novaSenha) next.novaSenha = 'Nova senha e obrigatoria'
    if (novaSenha.length < 6) next.novaSenha = 'Minimo 6 caracteres'
    if (novaSenha !== confirmarSenha) next.confirmarSenha = 'Senhas nao conferem'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        token: token.trim(),
        novaSenha,
      })
      toast.sucesso('Senha alterada com sucesso!')
      navigate('/login', { replace: true })
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao redefinir senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout align="right" promoTitle={PROMO_TITLE} promoText={PROMO_TEXT}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <LogoMeuPDV />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              {step === 1 ? 'Esqueci a senha' : 'Redefinir senha'}
            </h1>
            <p className="text-text-secondary mt-1">
              {step === 1
                ? 'Informe seu email para receber o codigo de recuperacao'
                : 'Digite o codigo recebido e sua nova senha'}
            </p>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
            <TextField
              label="E-mail"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-5 w-5" />}
              error={errors.email}
              autoComplete="email"
            />
            <PrimaryButton type="submit" fullWidth loading={loading}>
              {loading ? 'Enviando...' : 'Solicitar codigo'}
            </PrimaryButton>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao login
            </Link>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            {resetCode && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-sm font-semibold">Seu codigo de recuperacao</span>
                </div>
                <p className="text-2xl font-bold tracking-widest text-green-800">{resetCode}</p>
                <p className="text-xs text-green-600 mt-1">Valido por 30 minutos</p>
              </div>
            )}
            <TextField
              label="Codigo de 6 digitos"
              name="token"
              type="text"
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              leftIcon={<KeyRound className="h-5 w-5" />}
              error={errors.token}
              autoComplete="one-time-code"
            />
            <TextField
              label="Nova senha"
              name="novaSenha"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              error={errors.novaSenha}
              autoComplete="new-password"
            />
            <TextField
              label="Confirmar nova senha"
              name="confirmarSenha"
              type="password"
              placeholder="Repita a nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              error={errors.confirmarSenha}
              autoComplete="new-password"
            />
            <PrimaryButton type="submit" fullWidth loading={loading}>
              {loading ? 'Redefinindo...' : 'Redefinir senha'}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => { setStep(1); setResetCode(''); setToken(''); }}
              className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          </form>
        )}
      </div>
    </AuthSplitLayout>
  )
}
