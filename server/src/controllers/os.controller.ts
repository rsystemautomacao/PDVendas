import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { osService } from '../services/os.service';

export const osController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await osService.list(req.query);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const os = await osService.getById(req.params.id as string);
    res.json({ success: true, data: os });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const os = await osService.create(req.body);
    res.status(201).json({ success: true, data: os });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const os = await osService.update(req.params.id as string, req.body);
    res.json({ success: true, data: os });
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const os = await osService.cancel(req.params.id as string, req.body.motivo);
    res.json({ success: true, data: os });
  }),

  stats: asyncHandler(async (req: Request, res: Response) => {
    const { de, ate } = req.query as any;
    const stats = await osService.getStats(de, ate);
    res.json({ success: true, data: stats });
  }),
};
