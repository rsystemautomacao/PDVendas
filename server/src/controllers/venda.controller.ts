import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { vendaService } from '../services/venda.service';
import { User } from '../models/User';

export const vendaController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const result = await vendaService.list(req.query, empresaId);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const venda = await vendaService.getById(req.params.id as string, empresaId);
    res.json({ success: true, data: venda });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const user = await User.findById(req.user!._id);
    const vendedorNome = user?.nome || 'Operador';
    const venda = await vendaService.create(req.body, req.user!._id, vendedorNome, empresaId);
    res.status(201).json({ success: true, data: venda });
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const venda = await vendaService.cancel(req.params.id as string, req.body.motivo, empresaId);
    res.json({ success: true, data: venda });
  }),

  today: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const vendas = await vendaService.getToday(empresaId);
    res.json({ success: true, data: vendas });
  }),

  stats: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const { de, ate } = req.query as any;
    const stats = await vendaService.getStats(de, ate, empresaId);
    res.json({ success: true, data: stats });
  }),
};
