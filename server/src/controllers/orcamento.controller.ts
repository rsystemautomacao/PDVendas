import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { orcamentoService } from '../services/orcamento.service';

export const orcamentoController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const result = await orcamentoService.list(req.query, empresaId);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const orcamento = await orcamentoService.getById(req.params.id as string, empresaId);
    res.json({ success: true, data: orcamento });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const orcamento = await orcamentoService.create(req.body, empresaId);
    res.status(201).json({ success: true, data: orcamento });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const orcamento = await orcamentoService.update(req.params.id as string, req.body, empresaId);
    res.json({ success: true, data: orcamento });
  }),

  convertToOS: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const os = await orcamentoService.convertToOS(req.params.id as string, empresaId);
    res.status(201).json({ success: true, data: os });
  }),

  stats: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const { de, ate } = req.query as any;
    const stats = await orcamentoService.getStats(de, ate, empresaId);
    res.json({ success: true, data: stats });
  }),
};
