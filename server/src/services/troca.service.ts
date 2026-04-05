import mongoose from 'mongoose';
import { Troca } from '../models/Troca';
import { Venda } from '../models/Venda';
import { Produto } from '../models/Produto';
import { AppError } from '../middleware/errorHandler';
import { getNextSequence } from './counter.service';

export const trocaService = {
  async list(query: any, empresaId: string) {
    const { de, ate, tipo, status, page = 1, limit = 50 } = query;
    const filter: any = { empresaId };

    if (de || ate) {
      filter.criadoEm = {};
      if (de) filter.criadoEm.$gte = new Date(de + 'T00:00:00.000Z');
      if (ate) filter.criadoEm.$lte = new Date(ate + 'T23:59:59.999Z');
    }
    if (tipo) filter.tipo = tipo;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Troca.find(filter).sort({ criadoEm: -1 }).skip(skip).limit(Number(limit)),
      Troca.countDocuments(filter),
    ]);

    return {
      data,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    };
  },

  async getById(id: string, empresaId: string) {
    const troca = await Troca.findOne({ _id: id, empresaId });
    if (!troca) throw new AppError('Troca/devolucao nao encontrada', 404);
    return troca;
  },

  async create(data: any, operadorId: string, operadorNome: string, empresaId: string) {
    // Verificar se a venda existe
    const venda = await Venda.findOne({ _id: data.vendaId, empresaId });
    if (!venda) throw new AppError('Venda nao encontrada', 404);
    if (venda.status !== 'finalizada') throw new AppError('Apenas vendas finalizadas podem ter trocas/devolucoes', 400);

    const numero = await getNextSequence('troca_num', empresaId);

    const troca = await Troca.create({
      ...data,
      empresaId,
      numero,
      operadorId,
      operadorNome,
    });

    return troca;
  },

  async updateStatus(id: string, status: string, aprovadoPor: string, empresaId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const troca = await Troca.findOne({ _id: id, empresaId }).session(session);
      if (!troca) throw new AppError('Troca/devolucao nao encontrada', 404);
      if (troca.status !== 'pendente') throw new AppError('Esta troca/devolucao ja foi processada', 400);

      if (status === 'aprovada') {
        // Devolver itens ao estoque
        for (const item of troca.itensDevolvidos) {
          await Produto.findOneAndUpdate(
            { _id: item.produtoId, empresaId },
            { $inc: { estoque: item.quantidade } },
            { session }
          );
        }

        // Baixar itens novos do estoque (se troca)
        for (const item of troca.itensNovos) {
          await Produto.findOneAndUpdate(
            { _id: item.produtoId, empresaId },
            { $inc: { estoque: -item.quantidade } },
            { session }
          );
        }
      }

      troca.status = status as any;
      troca.aprovadoPor = aprovadoPor;
      await troca.save({ session });

      await session.commitTransaction();
      return troca;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
};
