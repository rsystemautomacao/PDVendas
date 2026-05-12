import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authService } from '../services/auth.service';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, senha, forceLogin } = req.body;
    const deviceInfo = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || '';

    const result = await authService.login(email, senha, { forceLogin, deviceInfo, ipAddress });
    res.json({ success: true, data: result });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const jti = req.user?.jti;
    if (jti) await authService.logout(jti);
    res.json({ success: true, data: { message: 'Logout realizado' } });
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!._id);
    res.json({ success: true, data: user });
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.updateMe(req.user!._id, req.body);
    res.json({ success: true, data: user });
  }),

  requestReset: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestReset(req.body.email);
    res.json({ success: true, data: result });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email, token, novaSenha } = req.body;
    const result = await authService.resetPassword(email, token, novaSenha);
    res.json({ success: true, data: result });
  }),
};
