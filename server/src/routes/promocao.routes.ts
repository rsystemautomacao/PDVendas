import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { Promocao } from '../models/Promocao';

const router = Router();

router.use(authenticate);

// Listar promocoes da empresa
router.get('/', async (req: any, res) => {
  try {
    const empresaId = req.user.adminId || req.user._id;
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
    const empresaId = req.user.adminId || req.user._id;
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
    const empresaId = req.user.adminId || req.user._id;
    const promo = await Promocao.create({ ...req.body, empresaId });
    res.status(201).json({ success: true, data: promo });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Atualizar promocao
router.put('/:id', async (req: any, res) => {
  try {
    const empresaId = req.user.adminId || req.user._id;
    const promo = await Promocao.findOneAndUpdate(
      { _id: req.params.id, empresaId },
      req.body,
      { new: true, runValidators: true }
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
    const empresaId = req.user.adminId || req.user._id;
    await Promocao.findOneAndDelete({ _id: req.params.id, empresaId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
