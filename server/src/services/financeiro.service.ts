import { ContaPagar } from '../models/ContaPagar';
import { ContaReceber } from '../models/ContaReceber';
import { Despesa } from '../models/Despesa';
import { AppError } from '../middleware/errorHandler';

export const financeiroService = {
  // ===== CONTAS A PAGAR =====
  async listCP(query: any) {
    const { de, ate, pago, page = 1, limit = 50 } = query;
    const filter: any = {};
    if (de) filter.vencimento = { ...filter.vencimento, $gte: de };
    if (ate) filter.vencimento = { ...filter.vencimento, $lte: ate };
    if (pago !== undefined) filter.pago = pago === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      ContaPagar.find(filter).sort({ vencimento: 1 }).skip(skip).limit(Number(limit)),
      ContaPagar.countDocuments(filter),
    ]);
    return { data, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
  },

  async createCP(data: any) {
    return ContaPagar.create(data);
  },

  async payCP(id: string) {
    const conta = await ContaPagar.findById(id);
    if (!conta) throw new AppError('Conta não encontrada', 404);
    conta.pago = true;
    conta.pagoEm = new Date().toISOString().split('T')[0];
    conta.valorPago = conta.valor;
    await conta.save();
    return conta;
  },

  async deleteCP(id: string) {
    const conta = await ContaPagar.findByIdAndDelete(id);
    if (!conta) throw new AppError('Conta não encontrada', 404);
    return conta;
  },

  // ===== CONTAS A RECEBER =====
  async listCR(query: any) {
    const { de, ate, recebido, page = 1, limit = 50 } = query;
    const filter: any = {};
    if (de) filter.vencimento = { ...filter.vencimento, $gte: de };
    if (ate) filter.vencimento = { ...filter.vencimento, $lte: ate };
    if (recebido !== undefined) filter.recebido = recebido === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      ContaReceber.find(filter).sort({ vencimento: 1 }).skip(skip).limit(Number(limit)),
      ContaReceber.countDocuments(filter),
    ]);
    return { data, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
  },

  async createCR(data: any) {
    return ContaReceber.create(data);
  },

  async receiveCR(id: string) {
    const conta = await ContaReceber.findById(id);
    if (!conta) throw new AppError('Conta não encontrada', 404);
    conta.recebido = true;
    conta.recebidoEm = new Date().toISOString().split('T')[0];
    conta.valorRecebido = conta.valor;
    await conta.save();
    return conta;
  },

  async deleteCR(id: string) {
    const conta = await ContaReceber.findByIdAndDelete(id);
    if (!conta) throw new AppError('Conta não encontrada', 404);
    return conta;
  },

  // ===== DESPESAS =====
  async listDespesas(query: any) {
    const { de, ate, tipo, pago, page = 1, limit = 50 } = query;
    const filter: any = {};
    if (de) filter.vencimento = { ...filter.vencimento, $gte: de };
    if (ate) filter.vencimento = { ...filter.vencimento, $lte: ate };
    if (tipo) filter.tipo = tipo;
    if (pago !== undefined) filter.pago = pago === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Despesa.find(filter).sort({ vencimento: 1 }).skip(skip).limit(Number(limit)),
      Despesa.countDocuments(filter),
    ]);
    return { data, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
  },

  async getDespesa(id: string) {
    const despesa = await Despesa.findById(id);
    if (!despesa) throw new AppError('Despesa não encontrada', 404);
    return despesa;
  },

  async createDespesa(data: any) {
    return Despesa.create(data);
  },

  async updateDespesa(id: string, data: any) {
    const despesa = await Despesa.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!despesa) throw new AppError('Despesa não encontrada', 404);
    return despesa;
  },

  async payDespesa(id: string) {
    const despesa = await Despesa.findById(id);
    if (!despesa) throw new AppError('Despesa não encontrada', 404);
    despesa.pago = true;
    despesa.pagoEm = new Date().toISOString().split('T')[0];
    await despesa.save();
    return despesa;
  },

  async deleteDespesa(id: string) {
    const despesa = await Despesa.findByIdAndDelete(id);
    if (!despesa) throw new AppError('Despesa não encontrada', 404);
    return despesa;
  },

  // ===== RESUMO =====
  async summary() {
    const hoje = new Date().toISOString().split('T')[0];

    const [
      totalAPagar,
      totalAReceber,
      totalDespesasPendentes,
      contasVencidas,
    ] = await Promise.all([
      ContaPagar.aggregate([{ $match: { pago: false } }, { $group: { _id: null, total: { $sum: '$valor' } } }]),
      ContaReceber.aggregate([{ $match: { recebido: false } }, { $group: { _id: null, total: { $sum: '$valor' } } }]),
      Despesa.aggregate([{ $match: { pago: false } }, { $group: { _id: null, total: { $sum: '$valor' } } }]),
      ContaPagar.countDocuments({ pago: false, vencimento: { $lt: hoje } }),
    ]);

    return {
      totalAPagar: totalAPagar[0]?.total || 0,
      totalAReceber: totalAReceber[0]?.total || 0,
      totalDespesasPendentes: totalDespesasPendentes[0]?.total || 0,
      contasVencidas,
    };
  },
};
