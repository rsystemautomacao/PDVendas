import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { LogoMeuPDV } from '../components/LogoMeuPDV'
import { PrimaryButton } from '../components/PrimaryButton'
import { Stepper } from '../components/Stepper'

const PROMO_TITLE = 'Pronto para começar a vender mais?'
const PROMO_TEXT = 'Cadastre-se de forma rápida e tenha o controle total do seu negócio.'

export function RegisterStep2() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { name?: string; email?: string } | null

  if (!state?.email) {
    navigate('/register', { replace: true })
    return null
  }

  const { name, email } = state

  return (
    <AuthSplitLayout
      align="left"
      promoTitle={PROMO_TITLE}
      promoText={PROMO_TEXT}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <LogoMeuPDV />
          <Stepper steps={4} activeStep={2} completedSteps={1} />
          <h1 className="text-2xl font-bold text-text-primary">Confirme seu e-mail</h1>
        </div>

        <p className="text-center text-text-secondary">
          Enviamos um link de confirmação para <strong className="text-text-primary">{email}</strong>.
          Acesse sua caixa de entrada e clique no link para ativar sua conta.
        </p>

        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <Mail className="h-5 w-5 shrink-0 text-primary" />
          <span className="text-sm text-text-primary">{email}</span>
        </div>

        <PrimaryButton
          type="button"
          fullWidth
          onClick={() => navigate('/register/step-3', { state: { name, email } })}
        >
          Continuar
        </PrimaryButton>

        <p className="text-center text-sm text-text-secondary">
          Não recebeu o e-mail?{' '}
          <button
            type="button"
            className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            Reenviar
          </button>
        </p>

        <p className="text-center text-sm text-text-secondary">
          Já possui uma conta?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            Entre aqui
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  )
}
