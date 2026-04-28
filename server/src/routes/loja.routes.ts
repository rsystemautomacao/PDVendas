import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Loja } from '../models/Loja';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.user!.empresaId;
  const lojas = await Loja.find({ empresaId }).sort({ nome: 1 });
  res.json({ success: true, data: lojas });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.user!.empresaId;
  const loja = await Loja.create({ ...req.body, empresaId });
  res.status(201).json({ success: true, data: loja });
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.user!.empresaId;
  const loja = await Loja.findOneAndUpdate(
    { _id: req.params.id, empresaId },
    req.body,
    { new: true }
  );
  if (!loja) return res.status(404).json({ success: false, error: 'Loja nao encontrada' });
  res.json({ success: true, data: loja });
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.user!.empresaId;
  await Loja.findOneAndDelete({ _id: req.params.id, empresaId });
  res.json({ success: true });
}));

export default router;
