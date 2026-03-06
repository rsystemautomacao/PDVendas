import mongoose from 'mongoose';
import { Venda } from '../models/Venda';
import { Produto } from '../models/Produto';
import { Caixa } from '../models/Caixa';
import { AppError } from '../middleware/errorHandler';
import { getNextSequence } from './counter.service';

export const vendaService = {
  async list(query: any) {
    const { de, ate, clienteId, status, vendedorId, page = 1, limit = 50 } = query;
    const filter: any = {};

    if (de || ate) {
      filter.criadoEm = {};
      if (de) filter.criadoEm.$gte = new Date(de + 'T00:00:00.000Z');
      if (ate) filter.criadoEm.$lte = new Date(ate + 'T23:59:59.999Z');
    }
    if (clienteId) filter.clienteId = clienteId;
    if (vendedorId) filter.vendedorId = vendedorId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Venda.find(filter).sort({ criadoEm: -1 }).skip(skip).limit(Number(limit)),
      Venda.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  },

  async getById(id: string) {
    const venda = await Venda.findById(id);
    if (!venda) throw new AppError('Venda não encontrada', 404);
    return venda;
  },

  async create(data: any, vendedorId: string, vendedorNome: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verificar caixa aberto
      const caixa = await Caixa.findById(data.caixaId).session(session);
      if (!caixa || caixa.status !== 'aberto') {
        throw new AppError('Caixa não está aberto', 400);
      }

      // Gerar número sequencial
      const numero = await getNextSequence('venda_num');

      // Criar venda
      const [venda] = await Venda.create(
        [{
          ...data,
          numero,
          vendedorId,
          vendedorNome,
        }],
        { session }
      );

      // Atualizar estoque de cada item
      if (data.status === 'finalizada') {
        for (const item of data.itens) {
          const result = await Produto.findByIdAndUpdate(
            item.produtoId,
            { $inc: { estoque: -item.quantidade } },
            { session }
          );
          if (!result) throw new AppError(`Produto ${item.nome || item.produtoId} não encontrado`, 404);
        }

        // Registrar movimento no caixa
        caixa.movimentacoes.push({
          tipo: 'venda',
          valor: data.total,
          descricao: `Venda #${numero}`,
          criadoEm: new Date(),
        } as any);
        caixa.totalVendas += data.total;
        await caixa.save({ session });
      }

      await session.commitTransaction();
      return venda;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async cancel(id: string, motivo: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const venda = await Venda.findById(id).session(session);
      if (!venda) throw new AppError('Venda não encontrada', 404);
      if (venda.status === 'cancelada') throw new AppError('Venda já está cancelada', 400);

      // Restaurar estoque
      if (venda.status === 'finalizada') {
        for (const item of venda.itens) {
          await Produto.findByIdAndUpdate(
            item.produtoId,
            { $inc: { estoque: item.quantidade } },
            { session }
          );
        }

        // Registrar estorno no caixa
        const caixa = await Caixa.findById(venda.caixaId).session(session);
        if (caixa && caixa.status === 'aberto') {
          caixa.movimentacoes.push({
            tipo: 'estorno',
            valor: venda.total,
            descricao: `Estorno venda #${venda.numero}`,
            criadoEm: new Date(),
          } as any);
          caixa.totalVendas -= venda.total;
          await caixa.save({ session });
        }
      }

      venda.status = 'cancelada';
      venda.canceladoEm = new Date();
      venda.motivoCancelamento = motivo;
      await venda.save({ session });

      await session.commitTransaction();
      return venda;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Venda.find({
      criadoEm: { $gte: today, $lt: tomorrow },
      status: 'finalizada',
    }).sort({ criadoEm: -1 });
  },

  async getStats(de?: string, ate?: string) {
    const match: any = { status: 'finalizada' };
    if (de || ate) {
      match.criadoEm = {};
      if (de) match.criadoEm.$gte = new Date(de + 'T00:00:00.000Z');
      if (ate) match.criadoEm.$lte = new Date(ate + 'T23:59:59.999Z');
    }

    const result = await Venda.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalVendas: { $sum: '$total' },
          quantidadeVendas: { $sum: 1 },
          ticketMedio: { $avg: '$total' },
        },
      },
    ]);

    // Vendas por forma de pagamento
    const porFormaPgto = await Venda.aggregate([
      { $match: match },
      { $unwind: '$pagamentos' },
      {
        $group: {
          _id: '$pagamentos.forma',
          total: { $sum: '$pagamentos.valor' },
          quantidade: { $sum: 1 },
        },
      },
    ]);

    return {
      ...(result[0] || { totalVendas: 0, quantidadeVendas: 0, ticketMedio: 0 }),
      porFormaPagamento: porFormaPgto,
    };
  },
};
