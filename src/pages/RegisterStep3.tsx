import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { LogoMeuPDV } from '../components/LogoMeuPDV'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'
import { Stepper } from '../components/Stepper'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const PROMO_TITLE = 'Pronto para começar a vender mais?'
const PROMO_TEXT = 'Cadastre-se de forma rápida e tenha o controle total do seu negócio.'

export function RegisterStep3() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuth()
  const { sucesso, erro } = useToast()
  const state = location.state as { name?: string; email?: string } | null

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})

  if (!state?.email) {
    navigate('/register', { replace: true })
    return null
  }

  const validate = () => {
    const next: { password?: string; confirmPassword?: string } = {}
    if (password.length < 6) next.password = 'A senha deve ter pelo menos 6 caracteres'
    if (password !== confirmPassword) next.confirmPassword = 'As senhas não coincidem'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      const result = await register({
        nome: state.name || '',
        email: state.email || '',
        senha: password,
      })

      if (result.ok) {
        sucesso('Conta criada com sucesso! Bem-vindo ao MeuPDV!')
        navigate('/app', { replace: true })
      } else {
        erro(result.error || 'Erro ao criar conta')
      }
    } catch {
      erro('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      align="left"
      promoTitle={PROMO_TITLE}
      promoText={PROMO_TEXT}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <LogoMeuPDV />
          <Stepper steps={3} activeStep={2} completedSteps={1} />
          <h1 className="text-2xl font-bold text-text-primary">Crie sua senha</h1>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <p className="text-text-secondary">Criando conta para:</p>
          <p className="font-medium text-text-primary">{state.name} ({state.email})</p>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            label="Senha"
            name="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            error={errors.password}
            autoComplete="new-password"
          />
          <TextField
            label="Confirmar senha"
            name="confirmPassword"
            type="password"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
        </div>

        <PrimaryButton type="submit" fullWidth loading={loading}>
          Concluir cadastro
        </PrimaryButton>

        <p className="text-center text-sm text-text-secondary">
          Já possui uma conta?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            Entre aqui
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}
