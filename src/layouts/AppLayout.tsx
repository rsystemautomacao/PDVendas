import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Topbar } from '../components/app/Topbar'
import { FloatingHelp } from '../components/app/FloatingHelp'
import { Sidebar } from '../components/app/Sidebar'
import { RequireAuth } from '../contexts/AuthContext'
import { ProdutoProvider } from '../contexts/ProdutoContext'
import { ClienteProvider } from '../contexts/ClienteContext'
import { CaixaProvider } from '../contexts/CaixaContext'
import { VendaProvider } from '../contexts/VendaContext'
import { FinanceiroProvider } from '../contexts/FinanceiroContext'

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
        <Outlet />
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
                <AppLayoutInner />
              </FinanceiroProvider>
            </VendaProvider>
          </CaixaProvider>
        </ClienteProvider>
      </ProdutoProvider>
    </RequireAuth>
  )
}
