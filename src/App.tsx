import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Páginas de autenticação — carregadas imediatamente (primeira tela do usuário)
import { Login } from './pages/Login'
import { RegisterStep1 } from './pages/RegisterStep1'
import { RegisterStep2 } from './pages/RegisterStep2'
import { RegisterStep3 } from './pages/RegisterStep3'
import { ForgotPassword } from './pages/ForgotPassword'
import { AppLayout } from './layouts/AppLayout'

// Páginas do app — carregadas sob demanda (code splitting)
const DashboardPage          = lazy(() => import('./pages/app/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientesPage           = lazy(() => import('./pages/app/ClientesPage').then(m => ({ default: m.ClientesPage })))
const ClientePage            = lazy(() => import('./pages/app/ClientePage').then(m => ({ default: m.ClientePage })))
const RelatoriosMenuPage     = lazy(() => import('./pages/app/RelatoriosMenuPage').then(m => ({ default: m.RelatoriosMenuPage })))
const RelatorioClientesPage  = lazy(() => import('./pages/app/RelatorioClientesPage').then(m => ({ default: m.RelatorioClientesPage })))
const ContasAPagarPage       = lazy(() => import('./pages/app/ContasAPagarPage').then(m => ({ default: m.ContasAPagarPage })))
const ContasAReceberPage     = lazy(() => import('./pages/app/ContasAReceberPage').then(m => ({ default: m.ContasAReceberPage })))
const CaixasPage             = lazy(() => import('./pages/app/CaixasPage').then(m => ({ default: m.CaixasPage })))
const FluxoDeCaixaPage       = lazy(() => import('./pages/app/FluxoDeCaixaPage').then(m => ({ default: m.FluxoDeCaixaPage })))
const DespesasPage           = lazy(() => import('./pages/app/DespesasPage').then(m => ({ default: m.DespesasPage })))
const DespesaFormPage        = lazy(() => import('./pages/app/DespesaFormPage').then(m => ({ default: m.DespesaFormPage })))
const ProdutosPage           = lazy(() => import('./pages/app/ProdutosPage').then(m => ({ default: m.ProdutosPage })))
const ProdutoFormPage        = lazy(() => import('./pages/app/ProdutoFormPage').then(m => ({ default: m.ProdutoFormPage })))
const NovoPedidoPage         = lazy(() => import('./pages/app/NovoPedidoPage').then(m => ({ default: m.NovoPedidoPage })))
const VendasPage             = lazy(() => import('./pages/app/VendasPage').then(m => ({ default: m.VendasPage })))
const TrocasPage             = lazy(() => import('./pages/app/TrocasPage').then(m => ({ default: m.TrocasPage })))
const ComissoesPage          = lazy(() => import('./pages/app/ComissoesPage').then(m => ({ default: m.ComissoesPage })))
const ValidadePage           = lazy(() => import('./pages/app/ValidadePage').then(m => ({ default: m.ValidadePage })))
const EtiquetasPage          = lazy(() => import('./pages/app/EtiquetasPage').then(m => ({ default: m.EtiquetasPage })))
const ComprasPage            = lazy(() => import('./pages/app/ComprasPage').then(m => ({ default: m.ComprasPage })))
const OrdensServicoPage      = lazy(() => import('./pages/app/OrdensServicoPage').then(m => ({ default: m.OrdensServicoPage })))
const OrdemServicoFormPage   = lazy(() => import('./pages/app/OrdemServicoFormPage').then(m => ({ default: m.OrdemServicoFormPage })))
const OrcamentosPage         = lazy(() => import('./pages/app/OrcamentosPage').then(m => ({ default: m.OrcamentosPage })))
const OrcamentoFormPage      = lazy(() => import('./pages/app/OrcamentoFormPage').then(m => ({ default: m.OrcamentoFormPage })))
const AjudaPage              = lazy(() => import('./pages/app/AjudaPage').then(m => ({ default: m.AjudaPage })))
const NotificacoesPage       = lazy(() => import('./pages/app/NotificacoesPage').then(m => ({ default: m.NotificacoesPage })))
const CatalogoPage           = lazy(() => import('./pages/app/CatalogoPage').then(m => ({ default: m.CatalogoPage })))
const AplicativosPage        = lazy(() => import('./pages/app/AplicativosPage').then(m => ({ default: m.AplicativosPage })))
const RelatoriosGraficosPage = lazy(() => import('./pages/app/RelatoriosGraficosPage').then(m => ({ default: m.RelatoriosGraficosPage })))
const OnboardingPage         = lazy(() => import('./pages/app/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const MeuUsuarioPage         = lazy(() => import('./pages/app/config/MeuUsuarioPage').then(m => ({ default: m.MeuUsuarioPage })))
const MinhaEmpresaPage       = lazy(() => import('./pages/app/config/MinhaEmpresaPage').then(m => ({ default: m.MinhaEmpresaPage })))
const ParametrosPage         = lazy(() => import('./pages/app/config/ParametrosPage').then(m => ({ default: m.ParametrosPage })))
const PermissoesPage         = lazy(() => import('./pages/app/config/PermissoesPage').then(m => ({ default: m.PermissoesPage })))
const UsuariosPage           = lazy(() => import('./pages/app/config/UsuariosPage').then(m => ({ default: m.UsuariosPage })))
const MinhaAssinaturaPage    = lazy(() => import('./pages/app/config/MinhaAssinaturaPage').then(m => ({ default: m.MinhaAssinaturaPage })))
const ImpressorasPage        = lazy(() => import('./pages/app/config/ImpressorasPage').then(m => ({ default: m.ImpressorasPage })))
const LojasPage              = lazy(() => import('./pages/app/config/LojasPage').then(m => ({ default: m.LojasPage })))
const VitrinePublicaPage     = lazy(() => import('./pages/VitrinePublicaPage').then(m => ({ default: m.VitrinePublicaPage })))
const AdminPage              = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/vitrine/:empresaId" element={<VitrinePublicaPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterStep1 />} />
        <Route path="/register/step-2" element={<RegisterStep2 />} />
        <Route path="/register/step-3" element={<RegisterStep3 />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/app" element={<AppLayout />}>
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route index element={<DashboardPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="clientes/relatorios" element={<RelatoriosMenuPage />} />
          <Route path="clientes/relatorios/:tipo" element={<RelatorioClientesPage />} />
          <Route path="clientes/novo" element={<ClientePage />} />
          <Route path="clientes/:id" element={<ClientePage />} />
          <Route path="contas-a-pagar" element={<ContasAPagarPage />} />
          <Route path="contas-a-receber" element={<ContasAReceberPage />} />
          <Route path="caixas" element={<CaixasPage />} />
          <Route path="fluxo-de-caixa" element={<FluxoDeCaixaPage />} />
          <Route path="despesas" element={<DespesasPage />} />
          <Route path="despesas/novo" element={<DespesaFormPage />} />
          <Route path="despesas/:id" element={<DespesaFormPage />} />
          <Route path="produtos" element={<ProdutosPage />} />
          <Route path="produtos/novo" element={<ProdutoFormPage />} />
          <Route path="produtos/:id" element={<ProdutoFormPage />} />
          <Route path="novo-pedido" element={<NovoPedidoPage />} />
          <Route path="vendas" element={<VendasPage />} />
          <Route path="trocas" element={<TrocasPage />} />
          <Route path="comissoes" element={<ComissoesPage />} />
          <Route path="validade" element={<ValidadePage />} />
          <Route path="etiquetas" element={<EtiquetasPage />} />
          <Route path="ordens-servico" element={<OrdensServicoPage />} />
          <Route path="ordens-servico/nova" element={<OrdemServicoFormPage />} />
          <Route path="ordens-servico/:id" element={<OrdemServicoFormPage />} />
          <Route path="orcamentos" element={<OrcamentosPage />} />
          <Route path="orcamentos/novo" element={<OrcamentoFormPage />} />
          <Route path="orcamentos/:id" element={<OrcamentoFormPage />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="ajuda" element={<AjudaPage />} />
          <Route path="notificacoes" element={<NotificacoesPage />} />
          <Route path="catalogo" element={<CatalogoPage />} />
          <Route path="aplicativos" element={<AplicativosPage />} />
          <Route path="relatorios-graficos" element={<RelatoriosGraficosPage />} />
          <Route path="config/meu-usuario" element={<MeuUsuarioPage />} />
          <Route path="config/minha-empresa" element={<MinhaEmpresaPage />} />
          <Route path="config/parametros" element={<ParametrosPage />} />
          <Route path="config/permissoes" element={<PermissoesPage />} />
          <Route path="config/usuarios" element={<UsuariosPage />} />
          <Route path="config/assinatura" element={<MinhaAssinaturaPage />} />
          <Route path="config/impressoras" element={<ImpressorasPage />} />
          <Route path="config/lojas" element={<LojasPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
