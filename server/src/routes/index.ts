import { Router } from 'express';
import authRoutes from './auth.routes';
import produtoRoutes from './produto.routes';
import clienteRoutes from './cliente.routes';
import vendaRoutes from './venda.routes';
import caixaRoutes from './caixa.routes';
import financeiroRoutes from './financeiro.routes';
import compraRoutes from './compra.routes';
import notificacaoRoutes from './notificacao.routes';
import dashboardRoutes from './dashboard.routes';
import osRoutes from './os.routes';
import orcamentoRoutes from './orcamento.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/produtos', produtoRoutes);
router.use('/clientes', clienteRoutes);
router.use('/vendas', vendaRoutes);
router.use('/caixas', caixaRoutes);
router.use('/financeiro', financeiroRoutes);
router.use('/compras', compraRoutes);
router.use('/notificacoes', notificacaoRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/ordens-servico', osRoutes);
router.use('/orcamentos', orcamentoRoutes);
router.use('/usuarios', userRoutes);

export default router;
