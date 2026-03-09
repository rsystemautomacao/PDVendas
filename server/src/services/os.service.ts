import mongoose from 'mongoose';
import { OrdemServico } from '../models/OrdemServico';
import { Produto } from '../models/Produto';
import { AppError } from '../middleware/errorHandler';
import { getNextSequence } from './counter.service';

export const osService = {
  async list(query: any, empresaId: string) {
    const { de, ate, clienteId, status, tecnicoId, prioridade, page = 1, limit = 50 } = query;
    const filter: any = {};
    filter.empresaId = empresaId;

    if (de || ate) {
      filter.criadoEm = {};
      if (de) filter.criadoEm.$gte = new Date(de + 'T00:00:00.000Z');
      if (ate) filter.criadoEm.$lte = new Date(ate + 'T23:59:59.999Z');
    }
    if (clienteId) filter.clienteId = clienteId;
    if (tecnicoId) filter.tecnicoId = tecnicoId;
    if (status) filter.status = status;
    if (prioridade) filter.prioridade = prioridade;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      OrdemServico.find(filter).sort({ criadoEm: -1 }).skip(skip).limit(Number(limit)),
      OrdemServico.countDocuments(filter),
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

  async getById(id: string, empresaId: string) {
    const os = await OrdemServico.findOne({ _id: id, empresaId });
    if (!os) throw new AppError('Ordem de serviço não encontrada', 404);
    return os;
  },

  async create(data: any, empresaId: string) {
    const numero = await getNextSequence('os_num', empresaId);
    const os = await OrdemServico.create({ ...data, empresaId, numero });
    return os;
  },

  async update(id: string, data: any, empresaId: string) {
    const os = await OrdemServico.findOne({ _id: id, empresaId });
    if (!os) throw new AppError('Ordem de serviço não encontrada', 404);

    // Impedir edição de OS cancelada ou entregue
    if (os.status === 'cancelada') {
      throw new AppError('Não é possível editar uma OS cancelada', 400);
    }
    if (os.status === 'entregue') {
      throw new AppError('Não é possível editar uma OS já entregue', 400);
    }

    // Se mudou status para 'concluida', registrar data
    if (data.status === 'concluida' && os.status !== 'concluida') {
      data.concluidaEm = new Date();
    }

    // Se mudou status para 'entregue', registrar data e descontar peças do estoque
    if (data.status === 'entregue' && (os.status as string) !== 'entregue') {
      data.entregueEm = new Date();

      // Descontar peças do estoque
      const pecas = data.pecas || os.pecas;
      if (pecas && pecas.length > 0) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          for (const peca of [...pecas]) {
            if (peca.produtoId) {
              await Produto.findOneAndUpdate(
                { _id: peca.produtoId, empresaId },
                { $inc: { estoque: -peca.quantidade } },
                { session }
              );
            }
          }
          Object.assign(os, data);
          await os.save({ session });
          await session.commitTransaction();
          session.endSession();
          return os;
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          throw error;
        }
      }
    }

    Object.assign(os, data);
    await os.save();
    return os;
  },

  async cancel(id: string, motivo: string, empresaId: string) {
    const os = await OrdemServico.findOne({ _id: id, empresaId });
    if (!os) throw new AppError('Ordem de serviço não encontrada', 404);
    if (os.status === 'cancelada') throw new AppError('OS já está cancelada', 400);
    if (os.status === 'entregue') throw new AppError('Não é possível cancelar uma OS entregue', 400);

    os.status = 'cancelada';
    os.canceladaEm = new Date();
    os.motivoCancelamento = motivo;
    await os.save();
    return os;
  },

  async getStats(de?: string, ate?: string, empresaId?: string) {
    const empresaObjId = new mongoose.Types.ObjectId(empresaId);
    const match: any = { status: { $ne: 'cancelada' }, empresaId: empresaObjId };
    if (de || ate) {
      match.criadoEm = {};
      if (de) match.criadoEm.$gte = new Date(de + 'T00:00:00.000Z');
      if (ate) match.criadoEm.$lte = new Date(ate + 'T23:59:59.999Z');
    }

    const [porStatus, totais] = await Promise.all([
      OrdemServico.aggregate([
        { $match: de || ate ? match : { empresaId: empresaObjId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      OrdemServico.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalOS: { $sum: 1 },
            valorTotal: { $sum: '$total' },
            ticketMedio: { $avg: '$total' },
          },
        },
      ]),
    ]);

    return {
      porStatus,
      ...(totais[0] || { totalOS: 0, valorTotal: 0, ticketMedio: 0 }),
    };
  },
};
