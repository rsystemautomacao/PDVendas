import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { RegisterStep1 } from './pages/RegisterStep1'
import { RegisterStep2 } from './pages/RegisterStep2'
import { RegisterStep3 } from './pages/RegisterStep3'
import { ForgotPassword } from './pages/ForgotPassword'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/app/DashboardPage'
import { ClientesPage } from './pages/app/ClientesPage'
import { ClientePage } from './pages/app/ClientePage'
import { RelatoriosMenuPage } from './pages/app/RelatoriosMenuPage'
import { RelatorioClientesPage } from './pages/app/RelatorioClientesPage'
import { ContasAPagarPage } from './pages/app/ContasAPagarPage'
import { ContasAReceberPage } from './pages/app/ContasAReceberPage'
import { CaixasPage } from './pages/app/CaixasPage'
import { FluxoDeCaixaPage } from './pages/app/FluxoDeCaixaPage'
import { DespesasPage } from './pages/app/DespesasPage'
import { DespesaFormPage } from './pages/app/DespesaFormPage'
import { ProdutosPage } from './pages/app/ProdutosPage'
import { ProdutoFormPage } from './pages/app/ProdutoFormPage'
import { NovoPedidoPage } from './pages/app/NovoPedidoPage'
import { VendasPage } from './pages/app/VendasPage'
import { ComprasPage } from './pages/app/ComprasPage'
import { OrdensServicoPage } from './pages/app/OrdensServicoPage'
import { OrdemServicoFormPage } from './pages/app/OrdemServicoFormPage'
import { OrcamentosPage } from './pages/app/OrcamentosPage'
import { OrcamentoFormPage } from './pages/app/OrcamentoFormPage'
import { AjudaPage } from './pages/app/AjudaPage'
import { NotificacoesPage } from './pages/app/NotificacoesPage'
import { CatalogoPage } from './pages/app/CatalogoPage'
import { AplicativosPage } from './pages/app/AplicativosPage'
import { RelatoriosGraficosPage } from './pages/app/RelatoriosGraficosPage'
import { MeuUsuarioPage } from './pages/app/config/MeuUsuarioPage'
import { MinhaEmpresaPage } from './pages/app/config/MinhaEmpresaPage'
import { ParametrosPage } from './pages/app/config/ParametrosPage'
import { PermissoesPage } from './pages/app/config/PermissoesPage'
import { UsuariosPage } from './pages/app/config/UsuariosPage'
import { MinhaAssinaturaPage } from './pages/app/config/MinhaAssinaturaPage'
import { OnboardingPage } from './pages/app/OnboardingPage'
import { AdminPage } from './pages/AdminPage'

function App() {
  return (
    <Routes>
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
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
