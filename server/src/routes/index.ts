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
import adminRoutes from './admin.routes';
import trocaRoutes from './troca.routes';
import lojaRoutes from './loja.routes';
import stripeRoutes from './stripe.routes';
import promocaoRoutes from './promocao.routes';
import { Produto } from '../models/Produto';
import { Promocao } from '../models/Promocao';
import { User } from '../models/User';

const router = Router();

// Catalogo publico (sem autenticacao)
router.get('/catalogo/:empresaId', async (req, res) => {
  try {
    const empresa = await User.findOne({ _id: req.params.empresaId, role: 'admin' });
    if (!empresa) return res.status(404).json({ success: false, error: 'Empresa nao encontrada' });
    const produtos = await Produto.find({ empresaId: req.params.empresaId, ativo: true })
      .select('nome codigo preco precoAtacado qtdMinimaAtacado grupo marca estoque unidade categoria')
      .sort({ nome: 1 });

    // Buscar promocoes ativas para esta empresa
    const agora = new Date();
    const promocoes = await Promocao.find({
      empresaId: req.params.empresaId,
      ativo: true,
      dataInicio: { $lte: agora },
      $or: [{ dataFim: null }, { dataFim: { $gte: agora } }],
    }).select('nome percentual produtos grupo categoria');

    // Montar mapa de desconto por produto (maior desconto vence)
    const descontoMap: Record<string, { percentual: number; nomePromo: string }> = {};
    for (const promo of promocoes) {
      const prodIds = (promo.produtos || []).map((id: any) => id.toString());
      for (const prod of produtos) {
        const pid = (prod as any)._id.toString();
        // Produto esta explicitamente na lista OU bate com grupo/categoria do filtro
        const incluso = prodIds.includes(pid)
          || (promo.grupo && (prod as any).grupo === promo.grupo)
          || (promo.categoria && (prod as any).categoria === promo.categoria);
        if (incluso) {
          const atual = descontoMap[pid];
          if (!atual || promo.percentual > atual.percentual) {
            descontoMap[pid] = { percentual: promo.percentual, nomePromo: promo.nome };
          }
        }
      }
    }

    res.json({
      success: true,
      empresa: { nome: empresa.empresa?.nome || '', telefone: empresa.empresa?.telefone || '', logoBase64: empresa.empresa?.logoBase64 || '' },
      data: produtos,
      promocoes: descontoMap,
    });
  } catch {
    res.status(500).json({ success: false, error: 'Erro ao buscar catalogo' });
  }
});

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
router.use('/admin', adminRoutes);
router.use('/trocas', trocaRoutes);
router.use('/lojas', lojaRoutes);
router.use('/stripe', stripeRoutes);
router.use('/promocoes', promocaoRoutes);

export default router;
