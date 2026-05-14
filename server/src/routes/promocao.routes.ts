import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { Promocao } from '../models/Promocao';

const router = Router();

router.use(authenticate);

// Listar promocoes da empresa
router.get('/', async (req: any, res) => {
  try {
    const empresaId = req.user.empresaId;
    const promocoes = await Promocao.find({ empresaId })
      .populate('produtos', 'nome codigo preco grupo categoria')
      .sort({ criadoEm: -1 });
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
      .populate('produtos', 'nome codigo preco grupo categoria');
    if (!promo) return res.status(404).json({ success: false, error: 'Promocao nao encontrada' });
    res.json({ success: true, data: promo });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Criar promocao
router.post('/', async (req: any, res) => {
  try {
    const empresaId = req.user.empresaId;
    const b = req.body;

    // Inserir direto na collection para evitar problemas com _id getter do Mongoose 8
    const doc: any = {
      empresaId,
      nome: b.nome,
      percentual: Number(b.percentual),
      ativo: true,
      dataInicio: b.dataInicio ? new Date(b.dataInicio) : new Date(),
      produtos: b.produtos || [],
    };
    if (b.descricao) doc.descricao = b.descricao;
    if (b.dataFim) doc.dataFim = new Date(b.dataFim);
    if (b.grupo) doc.grupo = b.grupo;
    if (b.categoria) doc.categoria = b.categoria;

    const result = await Promocao.collection.insertOne(doc);
    const promo = await Promocao.findById(result.insertedId);

    res.status(201).json({ success: true, data: promo });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Atualizar promocao
router.put('/:id', async (req: any, res) => {
  try {
    const empresaId = req.user.empresaId;
    const b = req.body;

    // Montar update apenas com campos presentes
    const update: any = {};
    if (b.nome !== undefined) update.nome = b.nome;
    if (b.descricao !== undefined) update.descricao = b.descricao;
    if (b.percentual !== undefined) update.percentual = Number(b.percentual);
    if (b.produtos !== undefined) update.produtos = b.produtos;
    if (b.grupo !== undefined) update.grupo = b.grupo || null;
    if (b.categoria !== undefined) update.categoria = b.categoria || null;
    if (b.ativo !== undefined) update.ativo = b.ativo;
    if (b.dataInicio !== undefined) update.dataInicio = b.dataInicio ? new Date(b.dataInicio) : new Date();
    if (b.dataFim !== undefined) update.dataFim = b.dataFim ? new Date(b.dataFim) : null;

    const promo = await Promocao.findOneAndUpdate(
      { _id: req.params.id, empresaId },
      { $set: update },
      { new: true }
    );
    if (!promo) return res.status(404).json({ success: false, error: 'Promocao nao encontrada' });
    res.json({ success: true, data: promo });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Deletar promocao
router.delete('/:id', async (req: any, res) => {
  try {
    const empresaId = req.user.empresaId;
    await Promocao.findOneAndDelete({ _id: req.params.id, empresaId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
