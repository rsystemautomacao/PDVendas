import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Topbar } from '../components/app/Topbar'
import { FloatingHelp } from '../components/app/FloatingHelp'
import { Sidebar } from '../components/app/Sidebar'
import { RequireAuth, useAuth } from '../contexts/AuthContext'
import { usePermissao, ROTA_PERMISSAO } from '../hooks/usePermissao'
import { ProdutoProvider } from '../contexts/ProdutoContext'
import { ClienteProvider } from '../contexts/ClienteContext'
import { CaixaProvider } from '../contexts/CaixaContext'
import { VendaProvider } from '../contexts/VendaContext'
import { FinanceiroProvider } from '../contexts/FinanceiroContext'
import { OrdemServicoProvider } from '../contexts/OrdemServicoContext'

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
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  useEffect(() => {
    if (!drawerOpen) return
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [drawerOpen, closeDrawer])

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar onMenuClick={() => setDrawerOpen((o) => !o)} />
      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 transform border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 ease-out
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Menu lateral"
        aria-hidden={!drawerOpen}
      >
        <div className="flex h-full flex-col pt-14">
          <Sidebar onClose={() => setDrawerOpen(false)} />
        </div>
      </aside>
      <main
        className={`pt-14 min-h-screen transition-[padding] duration-200 ${drawerOpen ? 'lg:pl-72' : ''}`}
        role="main"
      >
        <OnboardingGate />
      </main>
      <FloatingHelp />
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
