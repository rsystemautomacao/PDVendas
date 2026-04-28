import { Caixa } from '../models/Caixa';
import { AppError } from '../middleware/errorHandler';
import { getNextSequence } from './counter.service';

export const caixaService = {
  async list(empresaId: string, query?: any) {
    const { page = 1, limit = 50 } = query || {};
    const lim = Math.min(Number(limit), 200);
    const skip = (Number(page) - 1) * lim;
    const filter = { empresaId };
    const [data, total] = await Promise.all([
      Caixa.find(filter).sort({ abertoEm: -1 }).skip(skip).limit(lim),
      Caixa.countDocuments(filter),
    ]);
    return { data, pagination: { total, page: Number(page), limit: lim, pages: Math.ceil(total / lim) } };
  },

  async getById(id: string, empresaId: string) {
    const caixa = await Caixa.findOne({ _id: id, empresaId });
    if (!caixa) throw new AppError('Caixa não encontrado', 404);
    return caixa;
  },

  async getOpen(empresaId: string) {
    return Caixa.findOne({ status: 'aberto', empresaId });
  },

  async open(operadorId: string, operadorNome: string, valorAbertura: number, empresaId: string, observacoes?: string) {
    const existing = await Caixa.findOne({ status: 'aberto', empresaId });
    if (existing) throw new AppError('Já existe um caixa aberto', 409);

    const numero = await getNextSequence('caixa_num', empresaId!);
    return Caixa.create({
      numero,
      operadorId,
      operadorNome,
      valorAbertura,
      observacoes,
      empresaId,
      status: 'aberto',
      abertoEm: new Date(),
    });
  },

  async close(id: string, empresaId: string, observacoes?: string) {
    const caixa = await Caixa.findOne({ _id: id, empresaId });
    if (!caixa) throw new AppError('Caixa não encontrado', 404);
    if (caixa.status === 'fechado') throw new AppError('Caixa já está fechado', 400);

    const saldo = caixa.valorAbertura + caixa.totalEntradas - caixa.totalSaidas + caixa.totalVendas;
    caixa.status = 'fechado';
    caixa.valorFechamento = saldo;
    caixa.fechadoEm = new Date();
    if (observacoes) caixa.observacoes = observacoes;
    await caixa.save();
    return caixa;
  },

  async addMovement(id: string, mov: { tipo: string; valor: number; descricao: string }, empresaId: string) {
    const caixa = await Caixa.findOne({ _id: id, empresaId });
    if (!caixa) throw new AppError('Caixa não encontrado', 404);
    if (caixa.status === 'fechado') throw new AppError('Caixa está fechado', 400);

    caixa.movimentacoes.push({ ...mov, criadoEm: new Date() } as any);

    if (mov.tipo === 'reforco') caixa.totalEntradas += mov.valor;
    else if (mov.tipo === 'sangria') caixa.totalSaidas += mov.valor;
    else if (mov.tipo === 'venda') caixa.totalVendas += mov.valor;
    else if (mov.tipo === 'estorno') caixa.totalVendas -= mov.valor;

    await caixa.save();
    return caixa;
  },
};
