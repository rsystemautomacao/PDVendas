import { useState, useEffect } from 'react'
import { Crown, Check, CreditCard, ExternalLink, Loader2, AlertTriangle, Minus, Plus, Monitor, RefreshCw, XCircle, Clock } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'
import { useAuth } from '../../../contexts/AuthContext'
import { api } from '../../../services/api'

const PRECO_LICENCA = 49.90

interface AssinaturaStatus {
  maxLicencas: number
  statusAssinatura: string
  dataVencimento: string | null
  temAssinatura: boolean
}

export function MinhaAssinaturaPage() {
  const { sucesso, erro, info } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [statusParam, setStatusParam] = useState<string | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [status, setStatus] = useState<AssinaturaStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = params.get('status')
    if (s) {
      setStatusParam(s)
      if (s === 'sucesso') sucesso('Pagamento realizado com sucesso! Sua assinatura esta ativa.')
      else if (s === 'cancelado') info('Pagamento cancelado. Voce pode tentar novamente quando quiser.')
      window.history.replaceState({}, '', window.location.pathname)
    }
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const res = await api.get('/stripe/status')
      if (res.success && res.data) {
        setStatus(res.data)
        setQuantidade(res.data.maxLicencas || 1)
      }
    } catch {} finally {
      setStatusLoading(false)
    }
  }

  const handleAssinar = async () => {
    setLoading(true)
    try {
      const res = await api.post('/stripe/create-checkout', { quantity: quantidade })
      if (res.data?.url) window.location.href = res.data.url
    } catch (err: any) {
      erro(err.message || 'Erro ao iniciar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLicenses = async () => {
    if (!status || quantidade === status.maxLicencas) return
    const isUpgrade = quantidade > status.maxLicencas
    const msg = isUpgrade
      ? `Aumentar para ${quantidade} licenca(s)? Sera cobrado o valor proporcional imediatamente.`
      : `Diminuir para ${quantidade} licenca(s)? O novo valor sera aplicado no proximo ciclo de cobranca.`
    if (!confirm(msg)) return

    setUpdateLoading(true)
    try {
      const res = await api.patch('/stripe/update-licenses', { quantity: quantidade })
      if (res.success && res.data) {
        sucesso(res.data.message)
        await loadStatus()
      }
    } catch (err: any) {
      erro(err.message || 'Erro ao alterar licencas')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleCancelar = async () => {
    if (!confirm('Tem certeza que deseja cancelar? Sua assinatura continuara ativa ate o fim do periodo atual.')) return
    setCancelLoading(true)
    try {
      const res = await api.post('/stripe/cancel')
      if (res.success) {
        info(res.data?.message || 'Assinatura sera cancelada ao fim do periodo.')
        await loadStatus()
      }
    } catch (err: any) {
      erro(err.message || 'Erro ao cancelar')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleGerenciar = async () => {
    setPortalLoading(true)
    try {
      const res = await api.post('/stripe/portal')
      if (res.data?.url) window.location.href = res.data.url
    } catch (err: any) {
      erro(err.message || 'Erro ao abrir portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const total = (quantidade * PRECO_LICENCA).toFixed(2).replace('.', ',')
  const isAssinante = status?.temAssinatura && (status.statusAssinatura === 'ativa' || status.statusAssinatura === 'expirando')
  const isTeste = status?.statusAssinatura === 'teste' || (!status?.temAssinatura && user?.statusAssinatura === 'teste')
  const quantidadeMudou = status ? quantidade !== status.maxLicencas : false

  const diasRestantesTeste = user?.dataVencimento
    ? Math.max(0, Math.ceil((new Date(user.dataVencimento).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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

        {statusParam === 'sucesso' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <Check className="h-5 w-5" />
            Pagamento confirmado! Sua assinatura foi ativada.
          </div>
        )}

        {/* Card de status: Teste gratuito */}
        {isTeste && !isAssinante && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Periodo de Teste Gratuito</p>
                  <p className="mt-0.5 text-xs text-blue-600">
                    {diasRestantesTeste > 0
                      ? `${diasRestantesTeste} dia(s) restante(s) — Assine para continuar usando apos o teste`
                      : 'Teste encerrado — Assine para continuar usando o sistema'}
                  </p>
                </div>
              </div>
              {user?.dataVencimento && (
                <div className="text-right">
                  <p className="text-xs text-blue-600">Expira em</p>
                  <p className="text-sm font-semibold text-blue-800">
                    {new Date(user.dataVencimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card de status: Assinatura ativa */}
        {isAssinante && status && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-800">Assinatura Ativa</p>
                <p className="mt-0.5 text-xs text-green-600">
                  {status.maxLicencas} licenca(s) — R$ {(status.maxLicencas * PRECO_LICENCA).toFixed(2).replace('.', ',')}/mes
                </p>
                <p className="mt-0.5 text-xs text-green-600">
                  Renovacao automatica no cartao cadastrado
                </p>
              </div>
              {status.dataVencimento && (
                <div className="text-right">
                  <p className="text-xs text-green-600">Proxima cobranca</p>
                  <p className="text-sm font-semibold text-green-800">
                    {new Date(status.dataVencimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card do Plano */}
        <div className="mt-6 rounded-xl border border-primary/30 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                {isAssinante ? 'Alterar Licencas' : 'PDVendas Mensalidade'}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">R$ 49,90 por licenca/mes</p>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Monitor className="h-5 w-5" />
              <span className="text-sm font-medium">Por PDV</span>
            </div>
          </div>

          <hr className="my-4 border-gray-100" />

          {/* Seletor de Quantidade */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="text-sm font-medium text-text-primary">
              {isAssinante ? 'Ajuste a quantidade de licencas' : 'Quantas licencas voce precisa?'}
            </label>
            <p className="mt-0.5 text-xs text-text-secondary">Cada licenca permite usar 1 PDV simultaneo</p>

            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-gray-300 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                  disabled={quantidade <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-l-lg text-text-secondary transition-colors hover:bg-gray-100 disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex h-10 w-14 items-center justify-center border-x border-gray-300 text-lg font-bold text-text-primary">
                  {quantidade}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantidade(q => Math.min(50, q + 1))}
                  disabled={quantidade >= 50}
                  className="flex h-10 w-10 items-center justify-center rounded-r-lg text-text-secondary transition-colors hover:bg-gray-100 disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 text-right">
                <p className="text-2xl font-bold text-primary">R$ {total}</p>
                <p className="text-xs text-text-secondary">/mes</p>
              </div>
            </div>

            {isAssinante && quantidadeMudou && status && (
              <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                {quantidade > status.maxLicencas
                  ? 'O valor proporcional das novas licencas sera cobrado imediatamente no cartao.'
                  : 'A reducao de licencas tera efeito no proximo ciclo de cobranca. Sem creditos de retorno.'}
              </div>
            )}
          </div>

          <hr className="my-4 border-gray-100" />

          <ul className="space-y-2">
            {[
              'Produtos ilimitados',
              'Vendas ilimitadas',
              'Relatorios completos',
              'Suporte prioritario',
              'Todas as funcionalidades',
              `${quantidade} PDV(s) simultaneo(s)`,
            ].map(r => (
              <li key={r} className="flex items-center gap-2 text-sm text-text-secondary">
                <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                {r}
              </li>
            ))}
          </ul>

          {/* Botoes */}
          <div className="mt-6 space-y-3">
            {isAssinante ? (
              <>
                <button
                  type="button"
                  onClick={handleUpdateLicenses}
                  disabled={!quantidadeMudou || updateLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {updateLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {updateLoading
                    ? 'Atualizando...'
                    : quantidadeMudou
                    ? `Alterar para ${quantidade} licenca(s) — R$ ${total}/mes`
                    : 'Selecione uma quantidade diferente'}
                </button>

                <button
                  type="button"
                  onClick={handleGerenciar}
                  disabled={portalLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  Gerenciar Cartao e Faturas
                </button>

                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={cancelLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Cancelar Assinatura
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAssinar}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {loading ? 'Redirecionando...' : `Assinar ${quantidade} licenca(s) — R$ ${total}/mes`}
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <div className="text-xs text-amber-800">
            <p className="font-medium">Pagamento seguro via Stripe</p>
            <p className="mt-1">A cobranca e recorrente e sera renovada automaticamente todo mes no cartao cadastrado. Voce pode alterar licencas ou cancelar a qualquer momento.</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600" /> Renovacao automatica</span>
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600" /> Cancele quando quiser</span>
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600" /> Suporte incluso</span>
        </div>
      </div>
    </div>
  )
}
