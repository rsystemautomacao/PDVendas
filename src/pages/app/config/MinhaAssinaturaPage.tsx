import { useState } from 'react'
import { Crown, Tag, Package, Rocket, Check } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'

const STORAGE_KEY = 'meupdv_plano'

const PLANOS = [
  { id: 'basico', nome: 'Básico', preco: 'R$ 28,56', periodo: '/mês', icon: Tag, destaque: false, recursos: ['500 produtos', '1 usuário', 'Vendas ilimitadas', 'Suporte por email'] },
  { id: 'essencial', nome: 'Essencial', preco: 'R$ 34,28', periodo: '/mês', icon: Package, destaque: false, recursos: ['2.000 produtos', '3 usuários', 'Vendas ilimitadas', 'Relatórios básicos', 'Suporte prioritário'] },
  { id: 'pro', nome: 'Pro', preco: 'R$ 45,71', periodo: '/mês', icon: Rocket, destaque: true, recursos: ['Produtos ilimitados', '10 usuários', 'Vendas ilimitadas', 'Relatórios avançados', 'Integrações', 'Suporte 24h'] },
  { id: 'elite', nome: 'Elite', preco: 'R$ 66,67', periodo: '/mês', icon: Crown, destaque: false, recursos: ['Tudo do Pro', 'Usuários ilimitados', 'API completa', 'Multi-filial', 'Gerente dedicado'] },
]

export function MinhaAssinaturaPage() {
  const { sucesso, info } = useToast()
  const [planoAtual, setPlanoAtual] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || 'basico'
  })

  const handleSelecionar = (planoId: string) => {
    if (planoId === planoAtual) {
      info('Este já é o seu plano atual')
      return
    }
    localStorage.setItem(STORAGE_KEY, planoId)
    setPlanoAtual(planoId)
    const plano = PLANOS.find(p => p.id === planoId)
    sucesso(`Plano "${plano?.nome}" selecionado! Em um sistema real, o pagamento seria processado aqui.`)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Minha Assinatura</h1>
              <p className="text-sm text-text-secondary">Escolha o plano ideal para o seu negócio</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-600" /> Pagamento seguro</span>
            <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-600" /> Suporte incluso</span>
          </div>
        </div>

        {/* Plano Atual */}
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary-pale px-4 py-3">
          <p className="text-sm text-text-primary">
            Seu plano atual: <strong className="text-primary">{PLANOS.find(p => p.id === planoAtual)?.nome || 'Básico'}</strong>
          </p>
        </div>

        {/* Cards de Planos */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANOS.map(plano => {
            const Icon = plano.icon
            const isAtual = plano.id === planoAtual
            return (
              <div
                key={plano.id}
                className={`relative flex flex-col rounded-xl border p-5 transition-colors ${
                  plano.destaque
                    ? 'border-amber-400 bg-amber-50/50 shadow-lg'
                    : isAtual
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plano.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                    RECOMENDADO
                  </div>
                )}
                {isAtual && (
                  <div className="absolute -top-3 right-3 rounded bg-primary px-2 py-0.5 text-xs font-bold text-white">
                    ATUAL
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-text-primary">{plano.nome}</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {plano.preco}
                  <span className="text-sm font-normal text-text-secondary">{plano.periodo}</span>
                </p>

                <ul className="mt-4 flex-1 space-y-2">
                  {plano.recursos.map(r => (
                    <li key={r} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                      {r}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSelecionar(plano.id)}
                  className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    isAtual
                      ? 'border border-primary bg-white text-primary cursor-default'
                      : 'bg-primary text-white hover:bg-primary-hover'
                  }`}
                >
                  {isAtual ? 'Plano Atual' : 'Selecionar Plano'}
                </button>
              </div>
            )
          })}
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
          Em um ambiente de produção, a seleção de plano seria integrada com um gateway de pagamento.
          Os dados atuais são salvos localmente para demonstração.
        </p>
      </div>
    </div>
  )
}
