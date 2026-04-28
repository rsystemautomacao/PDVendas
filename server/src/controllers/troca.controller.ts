import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { trocaService } from '../services/troca.service';
import { User } from '../models/User';

export const trocaController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const result = await trocaService.list(req.query, empresaId);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const troca = await trocaService.getById(req.params.id as string, empresaId);
    res.json({ success: true, data: troca });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const user = await User.findById(req.user!._id);
    const operadorNome = user?.nome || 'Operador';
    const troca = await trocaService.create(req.body, req.user!._id, operadorNome, empresaId);
    res.status(201).json({ success: true, data: troca });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const user = await User.findById(req.user!._id);
    const aprovadoPor = user?.nome || 'Operador';
    const troca = await trocaService.updateStatus(req.params.id as string, req.body.status, aprovadoPor, empresaId);
    res.json({ success: true, data: troca });
  }),
};
