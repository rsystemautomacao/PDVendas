import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { produtoService } from '../services/produto.service';

export const produtoController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await produtoService.list(req.query);
    res.json({ success: true, ...result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const produto = await produtoService.getById(req.params.id as string);
    res.json({ success: true, data: produto });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const produto = await produtoService.create(req.body);
    res.status(201).json({ success: true, data: produto });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const produto = await produtoService.update(req.params.id as string, req.body);
    res.json({ success: true, data: produto });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await produtoService.remove(req.params.id as string);
    res.json({ success: true, data: { message: 'Produto removido' } });
  }),

  updateStock: asyncHandler(async (req: Request, res: Response) => {
    const { quantidade, operacao } = req.body;
    const produto = await produtoService.updateStock(req.params.id as string, quantidade, operacao);
    res.json({ success: true, data: produto });
  }),

  lowStock: asyncHandler(async (req: Request, res: Response) => {
    const produtos = await produtoService.getLowStock();
    res.json({ success: true, data: produtos });
  }),
};
