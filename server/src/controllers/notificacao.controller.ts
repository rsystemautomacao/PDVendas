import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { notificacaoService } from '../services/notificacao.service';

export const notificacaoController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const notificacoes = await notificacaoService.list(req.user!._id);
    res.json({ success: true, data: notificacoes });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const n = await notificacaoService.markRead(req.params.id as string);
    res.json({ success: true, data: n });
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const result = await notificacaoService.markAllRead(req.user!._id);
    res.json({ success: true, data: result });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await notificacaoService.remove(req.params.id as string);
    res.json({ success: true, data: { message: 'Notificação removida' } });
  }),

  removeAllRead: asyncHandler(async (req: Request, res: Response) => {
    const result = await notificacaoService.removeAllRead(req.user!._id);
    res.json({ success: true, data: result });
  }),
};
