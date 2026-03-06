import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { vendaService } from '../services/venda.service';
import { User } from '../models/User';

export const vendaController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await vendaService.list(req.query);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const venda = await vendaService.getById(req.params.id as string);
    res.json({ success: true, data: venda });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!._id);
    const vendedorNome = user?.nome || 'Operador';
    const venda = await vendaService.create(req.body, req.user!._id, vendedorNome);
    res.status(201).json({ success: true, data: venda });
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const venda = await vendaService.cancel(req.params.id as string, req.body.motivo);
    res.json({ success: true, data: venda });
  }),

  today: asyncHandler(async (req: Request, res: Response) => {
    const vendas = await vendaService.getToday();
    res.json({ success: true, data: vendas });
  }),

  stats: asyncHandler(async (req: Request, res: Response) => {
    const { de, ate } = req.query as any;
    const stats = await vendaService.getStats(de, ate);
    res.json({ success: true, data: stats });
  }),
};
