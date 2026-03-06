import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { financeiroService } from '../services/financeiro.service';

export const financeiroController = {
  // Contas a Pagar
  listCP: asyncHandler(async (req: Request, res: Response) => {
    const result = await financeiroService.listCP(req.query);
    res.json({ success: true, ...result });
  }),
  createCP: asyncHandler(async (req: Request, res: Response) => {
    const conta = await financeiroService.createCP(req.body);
    res.status(201).json({ success: true, data: conta });
  }),
  payCP: asyncHandler(async (req: Request, res: Response) => {
    const conta = await financeiroService.payCP(req.params.id as string);
    res.json({ success: true, data: conta });
  }),
  deleteCP: asyncHandler(async (req: Request, res: Response) => {
    await financeiroService.deleteCP(req.params.id as string);
    res.json({ success: true, data: { message: 'Conta removida' } });
  }),

  // Contas a Receber
  listCR: asyncHandler(async (req: Request, res: Response) => {
    const result = await financeiroService.listCR(req.query);
    res.json({ success: true, ...result });
  }),
  createCR: asyncHandler(async (req: Request, res: Response) => {
    const conta = await financeiroService.createCR(req.body);
    res.status(201).json({ success: true, data: conta });
  }),
  receiveCR: asyncHandler(async (req: Request, res: Response) => {
    const conta = await financeiroService.receiveCR(req.params.id as string);
    res.json({ success: true, data: conta });
  }),
  deleteCR: asyncHandler(async (req: Request, res: Response) => {
    await financeiroService.deleteCR(req.params.id as string);
    res.json({ success: true, data: { message: 'Conta removida' } });
  }),

  // Despesas
  listDespesas: asyncHandler(async (req: Request, res: Response) => {
    const result = await financeiroService.listDespesas(req.query);
    res.json({ success: true, ...result });
  }),
  getDespesa: asyncHandler(async (req: Request, res: Response) => {
    const despesa = await financeiroService.getDespesa(req.params.id as string);
    res.json({ success: true, data: despesa });
  }),
  createDespesa: asyncHandler(async (req: Request, res: Response) => {
    const despesa = await financeiroService.createDespesa(req.body);
    res.status(201).json({ success: true, data: despesa });
  }),
  updateDespesa: asyncHandler(async (req: Request, res: Response) => {
    const despesa = await financeiroService.updateDespesa(req.params.id as string, req.body);
    res.json({ success: true, data: despesa });
  }),
  payDespesa: asyncHandler(async (req: Request, res: Response) => {
    const despesa = await financeiroService.payDespesa(req.params.id as string);
    res.json({ success: true, data: despesa });
  }),
  deleteDespesa: asyncHandler(async (req: Request, res: Response) => {
    await financeiroService.deleteDespesa(req.params.id as string);
    res.json({ success: true, data: { message: 'Despesa removida' } });
  }),

  // Resumo
  summary: asyncHandler(async (req: Request, res: Response) => {
    const resumo = await financeiroService.summary();
    res.json({ success: true, data: resumo });
  }),
};
