import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { osService } from '../services/os.service';

export const osController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const result = await osService.list(req.query, empresaId);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const os = await osService.getById(req.params.id as string, empresaId);
    res.json({ success: true, data: os });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const os = await osService.create(req.body, empresaId);
    res.status(201).json({ success: true, data: os });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const os = await osService.update(req.params.id as string, req.body, empresaId);
    res.json({ success: true, data: os });
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const os = await osService.cancel(req.params.id as string, req.body.motivo, empresaId);
    res.json({ success: true, data: os });
  }),

  stats: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const { de, ate } = req.query as any;
    const stats = await osService.getStats(de, ate, empresaId);
    res.json({ success: true, data: stats });
  }),
};
