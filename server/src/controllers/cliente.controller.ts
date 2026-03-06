import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { clienteService } from '../services/cliente.service';

export const clienteController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await clienteService.list(req.query);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const cliente = await clienteService.getById(req.params.id as string);
    res.json({ success: true, data: cliente });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const cliente = await clienteService.create(req.body);
    res.status(201).json({ success: true, data: cliente });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const cliente = await clienteService.update(req.params.id as string, req.body);
    res.json({ success: true, data: cliente });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await clienteService.remove(req.params.id as string);
    res.json({ success: true, data: { message: 'Cliente removido' } });
  }),

  updateSaldo: asyncHandler(async (req: Request, res: Response) => {
    const cliente = await clienteService.updateSaldo(req.params.id as string, req.body.saldoDevedor);
    res.json({ success: true, data: cliente });
  }),
};
