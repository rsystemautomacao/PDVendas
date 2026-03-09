import { Cliente } from '../models/Cliente';
import { AppError } from '../middleware/errorHandler';

export const clienteService = {
  async list(query: any, empresaId: string) {
    const { busca, tipo, ativo, page = 1, limit = 50 } = query;
    const filter: any = {};
    filter.empresaId = empresaId;

    if (busca) {
      filter.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { cpfCnpj: { $regex: busca, $options: 'i' } },
        { email: { $regex: busca, $options: 'i' } },
      ];
    }
    if (tipo) filter.tipo = tipo;
    if (ativo !== undefined) filter.ativo = ativo === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Cliente.find(filter).sort({ criadoEm: -1 }).skip(skip).limit(Number(limit)),
      Cliente.countDocuments(filter),
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
    const cliente = await Cliente.findOne({ _id: id, empresaId });
    if (!cliente) throw new AppError('Cliente não encontrado', 404);
    return cliente;
  },

  async create(data: any, empresaId: string) {
    return Cliente.create({ ...data, empresaId });
  },

  async update(id: string, data: any, empresaId: string) {
    const cliente = await Cliente.findOneAndUpdate({ _id: id, empresaId }, data, { new: true, runValidators: true });
    if (!cliente) throw new AppError('Cliente não encontrado', 404);
    return cliente;
  },

  async remove(id: string, empresaId: string) {
    const cliente = await Cliente.findOneAndDelete({ _id: id, empresaId });
    if (!cliente) throw new AppError('Cliente não encontrado', 404);
    return cliente;
  },

  async updateSaldo(id: string, saldoDevedor: number, empresaId: string) {
    const cliente = await Cliente.findOneAndUpdate(
      { _id: id, empresaId },
      { saldoDevedor },
      { new: true, runValidators: true }
    );
    if (!cliente) throw new AppError('Cliente não encontrado', 404);
    return cliente;
  },
};
