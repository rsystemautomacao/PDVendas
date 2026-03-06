import { Cliente } from '../models/Cliente';
import { AppError } from '../middleware/errorHandler';

export const clienteService = {
  async list(query: any) {
    const { busca, tipo, ativo, page = 1, limit = 50 } = query;
    const filter: any = {};

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

  async getById(id: string) {
    const cliente = await Cliente.findById(id);
    if (!cliente) throw new AppError('Cliente não encontrado', 404);
    return cliente;
  },

  async create(data: any) {
    return Cliente.create(data);
  },

  async update(id: string, data: any) {
    const cliente = await Cliente.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!cliente) throw new AppError('Cliente não encontrado', 404);
    return cliente;
  },

  async remove(id: string) {
    const cliente = await Cliente.findByIdAndDelete(id);
    if (!cliente) throw new AppError('Cliente não encontrado', 404);
    return cliente;
  },

  async updateSaldo(id: string, saldoDevedor: number) {
    const cliente = await Cliente.findByIdAndUpdate(
      id,
      { saldoDevedor },
      { new: true, runValidators: true }
    );
    if (!cliente) throw new AppError('Cliente não encontrado', 404);
    return cliente;
  },
};
