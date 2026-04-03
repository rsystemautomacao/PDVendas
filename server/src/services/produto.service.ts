import { Produto } from '../models/Produto';
import { AppError } from '../middleware/errorHandler';

export const produtoService = {
  async list(query: any, empresaId: string) {
    const { busca, tipo, ativo, grupo, page = 1, limit = 50 } = query;
    const filter: any = {};
    filter.empresaId = empresaId;

    if (busca) {
      const escaped = String(busca).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { nome: { $regex: escaped, $options: 'i' } },
        { codigo: { $regex: escaped, $options: 'i' } },
        { codigoBarras: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (tipo) filter.tipo = tipo;
    if (ativo !== undefined) filter.ativo = ativo === 'true';
    if (grupo) filter.grupo = grupo;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Produto.find(filter).sort({ criadoEm: -1 }).skip(skip).limit(Number(limit)),
      Produto.countDocuments(filter),
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
    const produto = await Produto.findOne({ _id: id, empresaId });
    if (!produto) throw new AppError('Produto não encontrado', 404);
    return produto;
  },

  async create(data: any, empresaId: string) {
    return Produto.create({ ...data, empresaId });
  },

  async update(id: string, data: any, empresaId: string) {
    const produto = await Produto.findOneAndUpdate({ _id: id, empresaId }, data, { new: true, runValidators: true });
    if (!produto) throw new AppError('Produto não encontrado', 404);
    return produto;
  },

  async remove(id: string, empresaId: string) {
    const produto = await Produto.findOneAndDelete({ _id: id, empresaId });
    if (!produto) throw new AppError('Produto não encontrado', 404);
    return produto;
  },

  async updateStock(id: string, quantidade: number, operacao: string = 'set', empresaId: string) {
    let update: any;
    if (operacao === 'add') {
      update = { $inc: { estoque: quantidade } };
    } else if (operacao === 'subtract') {
      update = { $inc: { estoque: -quantidade } };
    } else {
      update = { $set: { estoque: quantidade } };
    }
    const produto = await Produto.findOneAndUpdate(
      { _id: id, empresaId },
      update,
      { new: true, runValidators: true }
    );
    if (!produto) throw new AppError('Produto não encontrado', 404);
    // Garantir que estoque não fique negativo
    if (produto.estoque < 0) {
      await Produto.findOneAndUpdate({ _id: id, empresaId }, { $set: { estoque: 0 } });
      produto.estoque = 0;
    }
    return produto;
  },

  async getLowStock(empresaId: string) {
    return Produto.find({
      empresaId,
      ativo: true,
      tipo: 'produto',
      $expr: { $lte: ['$estoque', '$estoqueMinimo'] },
    }).sort({ estoque: 1 });
  },
};
