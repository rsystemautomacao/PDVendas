import mongoose from 'mongoose';
import { Compra } from '../models/Compra';
import { Produto } from '../models/Produto';
import { AppError } from '../middleware/errorHandler';
import { getNextSequence } from './counter.service';

export const compraService = {
  async list(query: any) {
    const { status, page = 1, limit = 50 } = query;
    const filter: any = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Compra.find(filter).sort({ criadoEm: -1 }).skip(skip).limit(Number(limit)),
      Compra.countDocuments(filter),
    ]);
    return { data, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
  },

  async create(data: any) {
    const numero = await getNextSequence('compra_num');
    return Compra.create({ ...data, numero });
  },

  async update(id: string, data: any) {
    const compra = await Compra.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!compra) throw new AppError('Compra não encontrada', 404);
    return compra;
  },

  async receive(id: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const compra = await Compra.findById(id).session(session);
      if (!compra) throw new AppError('Compra não encontrada', 404);
      if (compra.status === 'recebida') throw new AppError('Compra já recebida', 400);

      // Atualizar estoque de cada item
      for (const item of [...compra.itens]) {
        await Produto.findByIdAndUpdate(
          item.produtoId,
          {
            $inc: { estoque: item.quantidade },
            $set: { precoCusto: item.custoUnitario },
          },
          { session }
        );
      }

      compra.status = 'recebida';
      compra.recebidaEm = new Date();
      await compra.save({ session });

      await session.commitTransaction();
      return compra;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
};
