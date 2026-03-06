import { Link } from 'react-router-dom'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { LogoMeuPDV } from '../components/LogoMeuPDV'

const PROMO_TITLE = 'Chega de planilhas e anotações!'
const PROMO_TEXT = 'Controle suas vendas, estoque e financeiro de forma simples e centralizada.'

export function ForgotPassword() {
  return (
    <AuthSplitLayout align="right" promoTitle={PROMO_TITLE} promoText={PROMO_TEXT}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <LogoMeuPDV />
          <h1 className="text-2xl font-bold text-text-primary">Esqueci a senha</h1>
          <p className="text-center text-text-secondary">
            Em breve você poderá redefinir sua senha por aqui. Por enquanto, entre em contato com o suporte.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex min-h-button items-center justify-center rounded-button bg-primary px-6 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Voltar ao login
        </Link>
      </div>
    </AuthSplitLayout>
  )
}
