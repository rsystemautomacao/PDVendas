import mongoose from 'mongoose';
import { Venda } from '../models/Venda';
import { Produto } from '../models/Produto';
import { Cliente } from '../models/Cliente';
import { ContaPagar } from '../models/ContaPagar';
import { ContaReceber } from '../models/ContaReceber';

export const dashboardService = {
  async getKPIs(empresaId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
    const hojeStr = hoje.toISOString().split('T')[0];

    const [
      vendasHoje,
      vendasMes,
      produtosAtivos,
      clientesAtivos,
      produtosBaixoEstoque,
      totalAPagar,
      totalAReceber,
      vendasRecentes,
    ] = await Promise.all([
      // Vendas hoje
      Venda.aggregate([
        { $match: { empresaId: new mongoose.Types.ObjectId(empresaId), criadoEm: { $gte: hoje, $lt: amanha }, status: 'finalizada' } },
        { $group: { _id: null, total: { $sum: '$total' }, quantidade: { $sum: 1 } } },
      ]),
      // Vendas do mês
      Venda.aggregate([
        { $match: { empresaId: new mongoose.Types.ObjectId(empresaId), criadoEm: { $gte: inicioMes, $lte: fimMes }, status: 'finalizada' } },
        { $group: { _id: null, total: { $sum: '$total' }, quantidade: { $sum: 1 } } },
      ]),
      // Produtos ativos
      Produto.countDocuments({ ativo: true, empresaId }),
      // Clientes ativos
      Cliente.countDocuments({ ativo: true, empresaId }),
      // Produtos com baixo estoque
      Produto.find({
        empresaId,
        ativo: true,
        tipo: 'produto',
        $expr: { $lte: ['$estoque', '$estoqueMinimo'] },
      }).limit(10).select('nome estoque estoqueMinimo'),
      // Total a pagar pendente
      ContaPagar.aggregate([{ $match: { empresaId: new mongoose.Types.ObjectId(empresaId), pago: false } }, { $group: { _id: null, total: { $sum: '$valor' } } }]),
      // Total a receber pendente
      ContaReceber.aggregate([{ $match: { empresaId: new mongoose.Types.ObjectId(empresaId), recebido: false } }, { $group: { _id: null, total: { $sum: '$valor' } } }]),
      // 5 vendas mais recentes
      Venda.find({ status: 'finalizada', empresaId }).sort({ criadoEm: -1 }).limit(5).select('numero clienteNome total criadoEm'),
    ]);

    return {
      vendasHoje: {
        total: vendasHoje[0]?.total || 0,
        quantidade: vendasHoje[0]?.quantidade || 0,
      },
      vendasMes: {
        total: vendasMes[0]?.total || 0,
        quantidade: vendasMes[0]?.quantidade || 0,
      },
      produtosAtivos,
      clientesAtivos,
      produtosBaixoEstoque,
      totalAPagar: totalAPagar[0]?.total || 0,
      totalAReceber: totalAReceber[0]?.total || 0,
      vendasRecentes,
    };
  },
};
