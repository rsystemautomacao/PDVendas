import { Caixa } from '../models/Caixa';
import { AppError } from '../middleware/errorHandler';
import { getNextSequence } from './counter.service';

export const caixaService = {
  async list() {
    return Caixa.find().sort({ abertoEm: -1 });
  },

  async getById(id: string) {
    const caixa = await Caixa.findById(id);
    if (!caixa) throw new AppError('Caixa não encontrado', 404);
    return caixa;
  },

  async getOpen() {
    return Caixa.findOne({ status: 'aberto' });
  },

  async open(operadorId: string, operadorNome: string, valorAbertura: number, observacoes?: string) {
    const existing = await Caixa.findOne({ status: 'aberto' });
    if (existing) throw new AppError('Já existe um caixa aberto', 409);

    const numero = await getNextSequence('caixa_num');
    return Caixa.create({
      numero,
      operadorId,
      operadorNome,
      valorAbertura,
      observacoes,
      status: 'aberto',
      abertoEm: new Date(),
    });
  },

  async close(id: string, observacoes?: string) {
    const caixa = await Caixa.findById(id);
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

  async addMovement(id: string, mov: { tipo: string; valor: number; descricao: string }) {
    const caixa = await Caixa.findById(id);
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
