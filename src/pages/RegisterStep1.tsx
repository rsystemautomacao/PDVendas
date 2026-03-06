import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail } from 'lucide-react'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { LogoMeuPDV } from '../components/LogoMeuPDV'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'
import { Stepper } from '../components/Stepper'

const PROMO_TITLE = 'Pronto para começar a vender mais?'
const PROMO_TEXT = 'Cadastre-se de forma rápida e tenha o controle total do seu negócio.'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterStep1() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const validate = () => {
    const next: { name?: string; email?: string } = {}
    if (!name.trim()) next.name = 'Nome é obrigatório'
    if (!email.trim()) next.email = 'E-mail é obrigatório'
    else if (!emailRegex.test(email)) next.email = 'E-mail inválido'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    // Ir direto para Step 3 (criação de senha) - Step 2 de confirmação de email
    // não faz sentido sem backend de envio de email
    setTimeout(() => {
      setLoading(false)
      navigate('/register/step-3', { state: { name, email } })
    }, 300)
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
          <Stepper steps={3} activeStep={1} completedSteps={0} />
          <h1 className="text-2xl font-bold text-text-primary">Crie sua conta</h1>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            label="Nome"
            name="name"
            type="text"
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="h-5 w-5" />}
            error={errors.name}
            autoComplete="name"
          />
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
        </div>

        <PrimaryButton type="submit" fullWidth loading={loading}>
          Avançar
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
