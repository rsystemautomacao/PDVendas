import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { caixaService } from '../services/caixa.service';
import { User } from '../models/User';

export const caixaController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const result = await caixaService.list(empresaId, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const caixa = await caixaService.getById(req.params.id as string, empresaId);
    res.json({ success: true, data: caixa });
  }),

  getOpen: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const caixa = await caixaService.getOpen(empresaId);
    res.json({ success: true, data: caixa });
  }),

  open: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const user = await User.findById(req.user!._id);
    const operadorNome = user?.nome || 'Operador';
    const caixa = await caixaService.open(
      req.user!._id,
      operadorNome,
      req.body.valorAbertura,
      empresaId,
      req.body.observacoes
    );
    res.status(201).json({ success: true, data: caixa });
  }),

  close: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const caixa = await caixaService.close(req.params.id as string, empresaId, req.body?.observacoes);
    res.json({ success: true, data: caixa });
  }),

  addMovement: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const caixa = await caixaService.addMovement(req.params.id as string, req.body, empresaId);
    res.json({ success: true, data: caixa });
  }),
};
