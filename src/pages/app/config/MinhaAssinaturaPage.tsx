import { useState, useEffect } from 'react'
import { Crown, Check, CreditCard, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'
import { api } from '../../../services/api'

export function MinhaAssinaturaPage() {
  const { sucesso, erro, info } = useToast()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [statusParam, setStatusParam] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    if (status) {
      setStatusParam(status)
      if (status === 'sucesso') {
        sucesso('Pagamento realizado com sucesso! Sua assinatura está ativa.')
      } else if (status === 'cancelado') {
        info('Pagamento cancelado. Você pode tentar novamente quando quiser.')
      }
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleAssinar = async () => {
    setLoading(true)
    try {
      const res = await api.post('/stripe/create-checkout')
      if (res.data?.url) {
        window.location.href = res.data.url
      }
    } catch (err: any) {
      erro(err.message || 'Erro ao iniciar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const handleGerenciar = async () => {
    setPortalLoading(true)
    try {
      const res = await api.post('/stripe/portal')
      if (res.data?.url) {
        window.location.href = res.data.url
      }
    } catch (err: any) {
      erro(err.message || 'Erro ao abrir portal')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Minha Assinatura</h1>
            <p className="text-sm text-text-secondary">Gerencie sua assinatura do PDVendas</p>
          </div>
        </div>

        {/* Feedback de retorno do Stripe */}
        {statusParam === 'sucesso' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <Check className="h-5 w-5" />
            Pagamento confirmado! Sua assinatura foi ativada.
          </div>
        )}

        {/* Card do Plano */}
        <div className="mt-6 rounded-xl border border-primary/30 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">PDVendas Mensalidade</h2>
              <p className="mt-1 text-sm text-text-secondary">Acesso completo ao sistema</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">R$ 49,90</p>
              <p className="text-sm text-text-secondary">/mês</p>
            </div>
          </div>

          <hr className="my-4 border-gray-100" />

          <ul className="space-y-2">
            {[
              'Produtos ilimitados',
              'Vendas ilimitadas',
              'Relatórios completos',
              'Múltiplos usuários',
              'Suporte prioritário',
              'Todas as funcionalidades',
            ].map(r => (
              <li key={r} className="flex items-center gap-2 text-sm text-text-secondary">
                <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                {r}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAssinar}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {loading ? 'Redirecionando...' : 'Assinar Agora'}
            </button>

            <button
              type="button"
              onClick={handleGerenciar}
              disabled={portalLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Gerenciar Assinatura
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <div className="text-xs text-amber-800">
            <p className="font-medium">Pagamento seguro via Stripe</p>
            <p className="mt-1">A cobrança é recorrente e será renovada automaticamente todo mês. Você pode cancelar a qualquer momento pelo botão "Gerenciar Assinatura".</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600" /> Pagamento seguro</span>
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600" /> Cancele quando quiser</span>
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600" /> Suporte incluso</span>
        </div>
      </div>
    </div>
  )
}
