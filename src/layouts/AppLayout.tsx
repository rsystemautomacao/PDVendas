import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, Lock, PhoneCall } from 'lucide-react'
import { Topbar } from '../components/app/Topbar'
import { Sidebar } from '../components/app/Sidebar'
import { RequireAuth, useAuth } from '../contexts/AuthContext'
import { usePermissao, ROTA_PERMISSAO } from '../hooks/usePermissao'
import { useSessionCheck } from '../hooks/useSessionCheck'
import { ProdutoProvider } from '../contexts/ProdutoContext'
import { ClienteProvider } from '../contexts/ClienteContext'
import { CaixaProvider } from '../contexts/CaixaContext'
import { VendaProvider } from '../contexts/VendaContext'
import { FinanceiroProvider } from '../contexts/FinanceiroContext'
import { OrdemServicoProvider } from '../contexts/OrdemServicoContext'

const GRACE_DAYS = 3 // dias de carência após vencimento

function calcularStatusAssinatura(dataVencimento?: string): {
  bloqueado: boolean
  diasVencidos: number
  diasRestantes: number
  expirando: boolean
} {
  if (!dataVencimento) return { bloqueado: false, diasVencidos: 0, diasRestantes: 999, expirando: false }
  const venc = new Date(dataVencimento)
  const now = new Date()
  const diffMs = venc.getTime() - now.getTime()
  const diffDias = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

  if (diffDias >= 0) {
    // ainda vigente
    return { bloqueado: false, diasVencidos: 0, diasRestantes: diffDias, expirando: diffDias <= 7 }
  } else {
    const diasVencidos = Math.abs(diffDias)
    return {
      bloqueado: diasVencidos > GRACE_DAYS,
      diasVencidos,
      diasRestantes: 0,
      expirando: false,
    }
  }
}

function AssinaturaBanner({ diasRestantes, diasVencidos }: { diasRestantes: number; diasVencidos: number }) {
  const diasGraca = GRACE_DAYS - diasVencidos
  if (diasVencidos > 0) {
    // Em carência
    return (
      <div className="bg-red-600 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-2">
        <AlertTriangle size={16} className="shrink-0" />
        <span>
          <strong>Assinatura vencida há {diasVencidos} dia{diasVencidos !== 1 ? 's' : ''}.</strong>
          {' '}O acesso será bloqueado em <strong>{diasGraca} dia{diasGraca !== 1 ? 's' : ''}</strong>.
          {' '}Entre em contato para regularizar.
        </span>
      </div>
    )
  }
  if (diasRestantes <= 7) {
    const cor = diasRestantes <= 1 ? 'bg-red-500' : diasRestantes <= 3 ? 'bg-orange-500' : 'bg-yellow-500'
    const texto = diasRestantes === 0 ? 'vence hoje' : diasRestantes === 1 ? 'vence amanhã' : `vence em ${diasRestantes} dias`
    return (
      <div className={`${cor} text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-2`}>
        <AlertTriangle size={16} className="shrink-0" />
        <span>
          <strong>Atenção:</strong> Sua assinatura <strong>{texto}</strong>. Providencie o pagamento para evitar bloqueio.
        </span>
      </div>
    )
  }
  return null
}

function AssinaturaBloqueada({ diasVencidos, dataVencimento }: { diasVencidos: number; dataVencimento: string }) {
  const { logout } = useAuth()
  const dataFmt = new Date(dataVencimento).toLocaleDateString('pt-BR')
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-red-800 p-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-900/40 mx-auto mb-6">
          <Lock size={40} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Acesso Bloqueado</h1>
        <p className="text-gray-400 mb-6">
          Sua assinatura venceu em <strong className="text-white">{dataFmt}</strong> ({diasVencidos} dias atrás)
          e o período de carência de {GRACE_DAYS} dias foi encerrado.
        </p>
        <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left space-y-2">
          <p className="text-sm text-gray-300 font-semibold">Para recuperar o acesso:</p>
          <p className="text-sm text-gray-400">1. Entre em contato com o suporte</p>
          <p className="text-sm text-gray-400">2. Regularize o pagamento da mensalidade</p>
          <p className="text-sm text-gray-400">3. Seu acesso será restaurado imediatamente</p>
        </div>
        <a
          href="https://wa.me/5511943950503?text=Olá, preciso regularizar minha assinatura do MeuPDV."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors mb-3"
        >
          <PhoneCall size={18} />
          Falar com o Suporte
        </a>
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

  // Check if current route requires a permission
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

function AppLayoutInner() {
  useSessionCheck()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user } = useAuth()

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  useEffect(() => {
    if (!drawerOpen) return
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [drawerOpen, closeDrawer])

  // Verificar status da assinatura
  const assinaturaStatus = calcularStatusAssinatura(user?.dataVencimento)

  // Bloqueio total se expirado além do período de carência
  if (assinaturaStatus.bloqueado && user?.dataVencimento) {
    return <AssinaturaBloqueada diasVencidos={assinaturaStatus.diasVencidos} dataVencimento={user.dataVencimento} />
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-slate-950 dark:text-gray-200">
      {/* Banner de aviso de assinatura */}
      {(assinaturaStatus.expirando || assinaturaStatus.diasVencidos > 0) && (
        <AssinaturaBanner
          diasRestantes={assinaturaStatus.diasRestantes}
          diasVencidos={assinaturaStatus.diasVencidos}
        />
      )}
      <Topbar onMenuClick={() => setDrawerOpen((o) => !o)} />
      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      {/* Sidebar */}
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
        <OnboardingGate />
      </main>
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
