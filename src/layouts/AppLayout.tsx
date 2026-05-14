import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, Lock, CreditCard } from 'lucide-react'
import { Topbar } from '../components/app/Topbar'
import { Sidebar } from '../components/app/Sidebar'
import { RequireAuth, useAuth } from '../contexts/AuthContext'
import { usePermissao, ROTA_PERMISSAO } from '../hooks/usePermissao'
import { useSessionCheck } from '../hooks/useSessionCheck'
import { useVersionCheck } from '../hooks/useVersionCheck'
import { UpdateBanner } from '../components/app/UpdateBanner'
import { AssinaturaAlerta } from '../components/app/AssinaturaAlerta'
import { ProdutoProvider } from '../contexts/ProdutoContext'
import { ClienteProvider } from '../contexts/ClienteContext'
import { CaixaProvider } from '../contexts/CaixaContext'
import { VendaProvider } from '../contexts/VendaContext'
import { FinanceiroProvider } from '../contexts/FinanceiroContext'
import { OrdemServicoProvider } from '../contexts/OrdemServicoContext'

function calcularStatusAssinatura(dataVencimento?: string, statusAssinatura?: string): {
  bloqueado: boolean
  diasVencidos: number
  diasRestantes: number
  expirando: boolean
  isTeste: boolean
} {
  const isTeste = statusAssinatura === 'teste'
  if (!dataVencimento) return { bloqueado: false, diasVencidos: 0, diasRestantes: 999, expirando: false, isTeste }
  const venc = new Date(dataVencimento)
  const now = new Date()
  const diffMs = venc.getTime() - now.getTime()
  const diffDias = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

  if (diffDias >= 0) {
    return { bloqueado: false, diasVencidos: 0, diasRestantes: diffDias, expirando: diffDias <= 7, isTeste }
  } else {
    const diasVencidos = Math.abs(diffDias)
    const graceDays = isTeste ? 0 : 3
    return {
      bloqueado: diasVencidos > graceDays,
      diasVencidos,
      diasRestantes: 0,
      expirando: false,
      isTeste,
    }
  }
}

// Banner fixo apenas para período de carência (já vencida, contagem regressiva para bloqueio)
function AssinaturaCarenciaBanner({ diasVencidos, isTeste }: { diasVencidos: number; isTeste: boolean }) {
  const navigate = useNavigate()
  const graceDays = isTeste ? 0 : 3
  const diasGraca = graceDays - diasVencidos
  return (
    <div className="bg-red-600 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-2 flex-wrap">
      <AlertTriangle size={16} className="shrink-0" />
      <span>
        {isTeste ? (
          <><strong>Período de teste expirado.</strong> Assine agora para continuar usando.</>
        ) : (
          <>
            <strong>Assinatura vencida há {diasVencidos} dia{diasVencidos !== 1 ? 's' : ''}.</strong>
            {diasGraca > 0 && <> Bloqueio em <strong>{diasGraca} dia{diasGraca !== 1 ? 's' : ''}</strong>.</>}
          </>
        )}
      </span>
      <button
        onClick={() => navigate('/app/config/assinatura')}
        className="ml-2 rounded-lg bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30 transition-colors"
      >
        Assinar Agora
      </button>
    </div>
  )
}

function AssinaturaBloqueada({ diasVencidos, dataVencimento, isTeste }: { diasVencidos: number; dataVencimento: string; isTeste: boolean }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const dataFmt = new Date(dataVencimento).toLocaleDateString('pt-BR')

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-red-800 p-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-900/40 mx-auto mb-6">
          <Lock size={40} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {isTeste ? 'Período de Teste Encerrado' : 'Acesso Bloqueado'}
        </h1>
        <p className="text-gray-400 mb-6">
          {isTeste ? (
            <>Seu teste gratuito de 7 dias encerrou em <strong className="text-white">{dataFmt}</strong>. Assine para continuar usando todas as funcionalidades.</>
          ) : (
            <>Sua assinatura venceu em <strong className="text-white">{dataFmt}</strong> ({diasVencidos} dias atrás) e o período de carência foi encerrado.</>
          )}
        </p>

        <button
          onClick={() => navigate('/app/config/assinatura')}
          className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl transition-colors mb-3"
        >
          <CreditCard size={18} />
          Assinar Agora — R$ 49,90/mês
        </button>

        <button
          onClick={logout}
          className="w-full text-sm text-gray-500 hover:text-gray-300 py-2 transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}

function OnboardingGate() {
  const { needsOnboarding } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (needsOnboarding &&
        !location.pathname.includes('/onboarding') &&
        !location.pathname.includes('/config/minha-empresa')) {
      navigate('/app/onboarding', { replace: true })
    }
  }, [needsOnboarding, location.pathname, navigate])

  return <PermissionGate />
}

function PermissionGate() {
  const location = useLocation()
  const { temPermissao } = usePermissao()

  const permissaoNecessaria = Object.entries(ROTA_PERMISSAO).find(
    ([rota]) => location.pathname === rota || location.pathname.startsWith(rota + '/')
  )

  if (permissaoNecessaria && !temPermissao(permissaoNecessaria[1])) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 p-6">
        <ShieldCheck className="h-16 w-16 mb-4 opacity-30" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Acesso Restrito</h2>
        <p className="text-sm text-center max-w-sm">
          Voce nao tem permissao para acessar esta pagina. Entre em contato com o administrador.
        </p>
      </div>
    )
  }

  return <Outlet />
}

// Dias em que o alerta de vencimento deve aparecer ao logar
const DIAS_ALERTA = [5, 4, 3, 2, 1]

function AppLayoutInner() {
  useSessionCheck()
  const { hasUpdate, doUpdate } = useVersionCheck()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showAssinaturaAlerta, setShowAssinaturaAlerta] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  useEffect(() => {
    if (!drawerOpen) return
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [drawerOpen, closeDrawer])

  const assinaturaStatus = calcularStatusAssinatura(user?.dataVencimento, user?.statusAssinatura)

  // Alerta de vencimento ao logar — apenas para pagamentos não-recorrentes (sem Stripe)
  useEffect(() => {
    const temStripe = !!(user as any)?.stripeSubscriptionId
    if (temStripe) return
    const { diasRestantes } = assinaturaStatus
    if (diasRestantes > 0 && DIAS_ALERTA.includes(diasRestantes)) {
      setShowAssinaturaAlerta(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Bloqueio total — mas permite acessar a página de assinatura para poder pagar
  const isAssinaturaPage = location.pathname === '/app/config/assinatura'
  if (assinaturaStatus.bloqueado && user?.dataVencimento && !isAssinaturaPage) {
    return <AssinaturaBloqueada diasVencidos={assinaturaStatus.diasVencidos} dataVencimento={user.dataVencimento} isTeste={assinaturaStatus.isTeste} />
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-slate-950 dark:text-gray-200">
      <Topbar onMenuClick={() => setDrawerOpen((o) => !o)} />
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 desktop:bg-black/30 desktop:backdrop-blur-sm transition-opacity"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-80 transform bg-white shadow-float transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-slate-900
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Menu lateral"
        aria-hidden={!drawerOpen}
      >
        <div className="flex h-full flex-col">
          <Sidebar onClose={() => setDrawerOpen(false)} />
        </div>
      </aside>
      <main
        className={`pt-14 min-h-screen transition-[padding] duration-300 ${drawerOpen ? 'lg:pl-80' : ''}`}
        role="main"
      >
        {/* Banner de nova versão */}
        {hasUpdate && <UpdateBanner onUpdate={doUpdate} />}
        {/* Banner fixo apenas durante período de carência (já vencida) */}
        {assinaturaStatus.diasVencidos > 0 && !(user as any)?.stripeSubscriptionId && (
          <AssinaturaCarenciaBanner
            diasVencidos={assinaturaStatus.diasVencidos}
            isTeste={assinaturaStatus.isTeste}
          />
        )}
        <OnboardingGate />
      </main>

      {/* Alerta de vencimento — aparece uma vez ao logar, não é fixo */}
      {showAssinaturaAlerta && (
        <AssinaturaAlerta
          diasRestantes={assinaturaStatus.diasRestantes}
          onDismiss={() => setShowAssinaturaAlerta(false)}
        />
      )}
    </div>
  )
}

export function AppLayout() {
  return (
    <RequireAuth>
      <ProdutoProvider>
        <ClienteProvider>
          <CaixaProvider>
            <VendaProvider>
              <FinanceiroProvider>
                <OrdemServicoProvider>
                  <AppLayoutInner />
                </OrdemServicoProvider>
              </FinanceiroProvider>
            </VendaProvider>
          </CaixaProvider>
        </ClienteProvider>
      </ProdutoProvider>
    </RequireAuth>
  )
}
