import mongoose from 'mongoose';
import { Orcamento } from '../models/Orcamento';
import { OrdemServico } from '../models/OrdemServico';
import { AppError } from '../middleware/errorHandler';
import { getNextSequence } from './counter.service';

export const orcamentoService = {
  async list(query: any, empresaId: string) {
    const { de, ate, clienteId, status, page = 1, limit = 50 } = query;
    const filter: any = { empresaId };

    if (de || ate) {
      filter.criadoEm = {};
      if (de) filter.criadoEm.$gte = new Date(de + 'T00:00:00.000Z');
      if (ate) filter.criadoEm.$lte = new Date(ate + 'T23:59:59.999Z');
    }
    if (clienteId) filter.clienteId = clienteId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Orcamento.find(filter).sort({ criadoEm: -1 }).skip(skip).limit(Number(limit)),
      Orcamento.countDocuments(filter),
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
    const orcamento = await Orcamento.findOne({ _id: id, empresaId });
    if (!orcamento) throw new AppError('Orçamento não encontrado', 404);
    return orcamento;
  },

  async create(data: any, empresaId: string) {
    const numero = await getNextSequence('orcamento_num', empresaId);
    const orcamento = await Orcamento.create({ ...data, numero, empresaId });
    return orcamento;
  },

  async update(id: string, data: any, empresaId: string) {
    const orcamento = await Orcamento.findOne({ _id: id, empresaId });
    if (!orcamento) throw new AppError('Orçamento não encontrado', 404);

    if (orcamento.status === 'convertido') {
      throw new AppError('Não é possível editar um orçamento já convertido em OS', 400);
    }

    // Registrar datas de mudança de status
    if (data.status === 'aprovado' && orcamento.status !== 'aprovado') {
      data.aprovadoEm = new Date();
    }
    if (data.status === 'recusado' && orcamento.status !== 'recusado') {
      data.recusadoEm = new Date();
    }

    Object.assign(orcamento, data);
    await orcamento.save();
    return orcamento;
  },

  async convertToOS(id: string, empresaId: string) {
    const orcamento = await Orcamento.findOne({ _id: id, empresaId });
    if (!orcamento) throw new AppError('Orçamento não encontrado', 404);

    if (orcamento.status !== 'aprovado') {
      throw new AppError('Apenas orçamentos aprovados podem ser convertidos em OS', 400);
    }

    // Separar itens em serviços e peças
    const servicos = [...orcamento.itens]
      .filter((i: any) => i.tipo === 'servico')
      .map((i: any) => ({
        descricao: i.descricao,
        valor: i.total,
      }));

    const pecas = [...orcamento.itens]
      .filter((i: any) => i.tipo === 'peca')
      .map((i: any) => ({
        produtoId: i.produtoId || undefined,
        nome: i.descricao,
        quantidade: i.quantidade,
        valorUnitario: i.valorUnitario,
        total: i.total,
      }));

    const valorServicos = servicos.reduce((s: number, sv: any) => s + sv.valor, 0);
    const valorPecas = pecas.reduce((s: number, p: any) => s + p.total, 0);

    const osNumero = await getNextSequence('os_num', empresaId);

    const os = await OrdemServico.create({
      empresaId,
      numero: osNumero,
      clienteId: orcamento.clienteId,
      clienteNome: orcamento.clienteNome,
      clienteTelefone: orcamento.clienteTelefone,
      dispositivo: orcamento.dispositivo,
      defeitoRelatado: orcamento.defeitoRelatado,
      servicos,
      pecas,
      valorServicos,
      valorPecas,
      desconto: orcamento.desconto,
      total: orcamento.total,
      status: 'aprovada',
      orcamentoId: orcamento._id,
      observacoes: orcamento.observacoes,
    });

    // Marcar orçamento como convertido
    orcamento.status = 'convertido';
    orcamento.set('osGeradaId', os._id);
    await orcamento.save();

    return os;
  },

  async getStats(de?: string, ate?: string, empresaId?: string) {
    const match: any = {};
    if (empresaId) match.empresaId = new mongoose.Types.ObjectId(empresaId);
    if (de || ate) {
      match.criadoEm = {};
      if (de) match.criadoEm.$gte = new Date(de + 'T00:00:00.000Z');
      if (ate) match.criadoEm.$lte = new Date(ate + 'T23:59:59.999Z');
    }

    const porStatus = await Orcamento.aggregate([
      { $match: Object.keys(match).length > 0 ? match : {} },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return { porStatus };
  },
};
