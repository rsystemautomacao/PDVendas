import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';

export interface JwtPayload {
  _id: string;
  email: string;
  role: string;
  empresaId: string;
}

// Estender Request do Express com user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware que verifica o token JWT no header Authorization.
 * Resolve empresaId: admin = proprio _id, sub-user = adminId.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { empresaId?: string };

    if (decoded.empresaId) {
      // Token novo: já tem empresaId
      req.user = decoded as JwtPayload;
    } else {
      // Token antigo (sem empresaId): resolver via DB
      const user = await User.findById(decoded._id).lean();
      if (!user) {
        return res.status(401).json({ success: false, error: 'Usuário não encontrado' });
      }
      const empresaId = user.role === 'admin'
        ? user._id.toString()
        : (user.adminId ? user.adminId.toString() : user._id.toString());
      req.user = { ...decoded, empresaId };
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado',
    });
  }
};

/**
 * Middleware de autorização por role.
 * Uso: authorize('admin', 'gerente')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para acessar este recurso',
      });
    }

    next();
  };
};
