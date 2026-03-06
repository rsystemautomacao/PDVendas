import { Produto } from '../models/Produto';
import { AppError } from '../middleware/errorHandler';

export const produtoService = {
  async list(query: any) {
    const { busca, tipo, ativo, grupo, page = 1, limit = 50 } = query;
    const filter: any = {};

    if (busca) {
      filter.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { codigo: { $regex: busca, $options: 'i' } },
        { codigoBarras: { $regex: busca, $options: 'i' } },
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

  async getById(id: string) {
    const produto = await Produto.findById(id);
    if (!produto) throw new AppError('Produto não encontrado', 404);
    return produto;
  },

  async create(data: any) {
    return Produto.create(data);
  },

  async update(id: string, data: any) {
    const produto = await Produto.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!produto) throw new AppError('Produto não encontrado', 404);
    return produto;
  },

  async remove(id: string) {
    const produto = await Produto.findByIdAndDelete(id);
    if (!produto) throw new AppError('Produto não encontrado', 404);
    return produto;
  },

  async updateStock(id: string, quantidade: number, operacao: string = 'set') {
    const produto = await Produto.findById(id);
    if (!produto) throw new AppError('Produto não encontrado', 404);

    if (operacao === 'add') {
      produto.estoque += quantidade;
    } else if (operacao === 'subtract') {
      produto.estoque = Math.max(0, produto.estoque - quantidade);
    } else {
      produto.estoque = quantidade;
    }
    await produto.save();
    return produto;
  },

  async getLowStock() {
    return Produto.find({
      ativo: true,
      tipo: 'produto',
      $expr: { $lte: ['$estoque', '$estoqueMinimo'] },
    }).sort({ estoque: 1 });
  },
};
