import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth';
import { Promocao } from '../models/Promocao';

const router = Router();

router.use(authenticate);

// Helper: converter string para ObjectId com segurança
function toOid(id: string) {
  return new mongoose.Types.ObjectId(id);
}

// Listar promocoes da empresa
router.get('/', async (req: any, res) => {
  try {
    const empresaId = req.user.empresaId;
    const promocoes = await Promocao.find({ empresaId })
      .populate('produtos', 'nome codigo preco grupo categoria')
      .sort({ criadoEm: -1 })
      .lean();
    res.json({ success: true, data: promocoes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Buscar promocao por ID
router.get('/:id', async (req: any, res) => {
  try {
    const empresaId = req.user.empresaId;
    const promo = await Promocao.findOne({ _id: req.params.id, empresaId })
      .populate('produtos', 'nome codigo preco grupo categoria')
      .lean();
    if (!promo) return res.status(404).json({ success: false, error: 'Promocao nao encontrada' });
    res.json({ success: true, data: promo });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Criar promocao — insere direto no MongoDB sem hidratar documento Mongoose
router.post('/', async (req: any, res) => {
  try {
    const empresaId = req.user.empresaId;
    const b = req.body;
    const now = new Date();

    const doc = {
      empresaId: toOid(empresaId),
      nome: b.nome as string,
      descricao: (b.descricao as string) || '',
      percentual: Number(b.percentual),
      ativo: true,
      dataInicio: b.dataInicio ? new Date(b.dataInicio) : now,
      dataFim: b.dataFim ? new Date(b.dataFim) : null,
      produtos: ((b.produtos || []) as string[]).map(toOid),
      grupo: (b.grupo as string) || null,
      categoria: (b.categoria as string) || null,
      criadoEm: now,
      atualizadoEm: now,
    };

    await Promocao.collection.insertOne(doc);

    // Retornar sucesso simples — frontend vai recarregar a lista
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Atualizar promocao — usa updateOne direto sem hidratar
router.put('/:id', async (req: any, res) => {
  try {
    const empresaId = req.user.empresaId;
    const b = req.body;
    const update: any = { atualizadoEm: new Date() };

    if (b.nome !== undefined) update.nome = b.nome;
    if (b.descricao !== undefined) update.descricao = b.descricao;
    if (b.percentual !== undefined) update.percentual = Number(b.percentual);
    if (b.produtos !== undefined) update.produtos = ((b.produtos || []) as string[]).map(toOid);
    if (b.grupo !== undefined) update.grupo = b.grupo || null;
    if (b.categoria !== undefined) update.categoria = b.categoria || null;
    if (b.ativo !== undefined) update.ativo = b.ativo;
    if (b.dataInicio !== undefined) update.dataInicio = b.dataInicio ? new Date(b.dataInicio) : new Date();
    if (b.dataFim !== undefined) update.dataFim = b.dataFim ? new Date(b.dataFim) : null;

    const result = await Promocao.collection.updateOne(
      { _id: toOid(req.params.id), empresaId: toOid(empresaId) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Promocao nao encontrada' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Deletar promocao
router.delete('/:id', async (req: any, res) => {
  try {
    const empresaId = req.user.empresaId;
    await Promocao.collection.deleteOne({
      _id: toOid(req.params.id),
      empresaId: toOid(empresaId),
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
