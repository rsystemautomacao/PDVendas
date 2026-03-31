import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { clienteService } from '../services/cliente.service';

export const clienteController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const result = await clienteService.list(req.query, empresaId);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const cliente = await clienteService.getById(req.params.id as string, empresaId);
    res.json({ success: true, data: cliente });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const cliente = await clienteService.create(req.body, empresaId);
    res.status(201).json({ success: true, data: cliente });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const cliente = await clienteService.update(req.params.id as string, req.body, empresaId);
    res.json({ success: true, data: cliente });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    await clienteService.remove(req.params.id as string, empresaId);
    res.json({ success: true, data: { message: 'Cliente removido' } });
  }),

  updateSaldo: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const cliente = await clienteService.updateSaldo(req.params.id as string, req.body.saldoDevedor, empresaId);
    res.json({ success: true, data: cliente });
  }),
};
