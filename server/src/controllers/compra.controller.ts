import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { compraService } from '../services/compra.service';

export const compraController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await compraService.list(req.query);
    res.json({ success: true, ...result });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const compra = await compraService.create(req.body);
    res.status(201).json({ success: true, data: compra });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const compra = await compraService.update(req.params.id as string, req.body);
    res.json({ success: true, data: compra });
  }),

  receive: asyncHandler(async (req: Request, res: Response) => {
    const compra = await compraService.receive(req.params.id as string);
    res.json({ success: true, data: compra });
  }),
};
