import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Lock } from 'lucide-react'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { LogoMeuPDV } from '../components/LogoMeuPDV'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'
import { SecondaryButton } from '../components/SecondaryButton'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const PROMO_TITLE = 'Chega de planilhas e anotacoes!'
const PROMO_TEXT = 'Controle suas vendas, estoque e financeiro de forma simples e centralizada.'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) next.email = 'E-mail ou usuario e obrigatorio'
    if (!password) next.password = 'Senha e obrigatoria'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const result = await login(email.trim(), password)
      if (result.ok) {
        toast.sucesso('Login realizado com sucesso!')
        navigate('/app', { replace: true })
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

  return (
    <AuthSplitLayout
      align="right"
      promoTitle={PROMO_TITLE}
      promoText={PROMO_TEXT}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <LogoMeuPDV />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              Bem-vindo ao MeuPDV
            </h1>
            <p className="text-text-secondary">Entre na sua conta para continuar</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            label="E-mail"
            name="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<User className="h-5 w-5" />}
            error={errors.email}
            autoComplete="username email"
          />
          <TextField
            label="Senha"
            name="password"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            error={errors.password}
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <Link
              to="/forgot"
              className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              Esqueci a senha
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <PrimaryButton type="submit" fullWidth loading={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </PrimaryButton>
          <p className="text-center text-sm text-text-secondary">Ainda nao tem uma conta?</p>
          <SecondaryButton
            type="button"
            fullWidth
            onClick={() => navigate('/register')}
          >
            Criar nova conta
          </SecondaryButton>
        </div>

        <footer className="mt-4 flex flex-col items-center gap-1 text-center text-sm">
          <a
            href="https://wa.me/5511943950503"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Precisa de ajuda? Fale conosco
          </a>
        </footer>
      </form>
    </AuthSplitLayout>
  )
}
