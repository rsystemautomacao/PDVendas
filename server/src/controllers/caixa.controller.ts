import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { caixaService } from '../services/caixa.service';
import { User } from '../models/User';

export const caixaController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const caixas = await caixaService.list();
    res.json({ success: true, data: caixas });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const caixa = await caixaService.getById(req.params.id as string);
    res.json({ success: true, data: caixa });
  }),

  getOpen: asyncHandler(async (req: Request, res: Response) => {
    const caixa = await caixaService.getOpen();
    res.json({ success: true, data: caixa });
  }),

  open: asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!._id);
    const operadorNome = user?.nome || 'Operador';
    const caixa = await caixaService.open(
      req.user!._id,
      operadorNome,
      req.body.valorAbertura,
      req.body.observacoes
    );
    res.status(201).json({ success: true, data: caixa });
  }),

  close: asyncHandler(async (req: Request, res: Response) => {
    const caixa = await caixaService.close(req.params.id as string, req.body?.observacoes);
    res.json({ success: true, data: caixa });
  }),

  addMovement: asyncHandler(async (req: Request, res: Response) => {
    const caixa = await caixaService.addMovement(req.params.id as string, req.body);
    res.json({ success: true, data: caixa });
  }),
};
