import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authService } from '../services/auth.service';
import { env } from '../config/env';

function setAuthCookie(res: Response, token: string) {
  res.cookie('meupdv_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
    path: '/',
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie('meupdv_token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    // Token em cookie httpOnly (não acessível via JS — proteção contra XSS)
    setAuthCookie(res, result.token);
    // Não retornar o token no body em produção
    const { token: _token, ...safeResult } = result;
    res.status(201).json({ success: true, data: safeResult });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, senha, forceLogin } = req.body;
    const deviceInfo = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || '';

    const result = await authService.login(email, senha, { forceLogin, deviceInfo, ipAddress });

    // Se requer confirmação de licença, não há token ainda
    if ((result as any).requiresConfirmation) {
      return res.json({ success: true, data: result });
    }

    // Token em cookie httpOnly
    setAuthCookie(res, (result as any).token);
    const { token: _token, ...safeResult } = result as any;
    res.json({ success: true, data: safeResult });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const jti = req.user?.jti;
    if (jti) await authService.logout(jti);
    clearAuthCookie(res);
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
