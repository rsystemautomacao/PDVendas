import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { Session } from '../models/Session';

export interface JwtPayload {
  _id: string;
  email: string;
  role: string;
  empresaId: string;
  jti?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware que verifica o token JWT no header Authorization.
 * Também verifica se a sessão (JTI) ainda é válida.
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
      req.user = decoded as JwtPayload;
    } else {
      const user = await User.findById(decoded._id).lean();
      if (!user) {
        return res.status(401).json({ success: false, error: 'Usuário não encontrado' });
      }
      const empresaId = user.role === 'admin'
        ? user._id.toString()
        : (user.adminId ? user.adminId.toString() : user._id.toString());
      req.user = { ...decoded, empresaId };
    }

    // Check session validity if token has JTI
    if (req.user.jti) {
      const session = await Session.findOne({ tokenJti: req.user.jti }).lean();
      if (session && !session.isValid) {
        return res.status(401).json({
          success: false,
          error: 'Sessão encerrada',
          code: 'SESSION_INVALIDATED',
          reason: session.invalidatedReason || 'unknown',
        });
      }

      // Atualiza lastActivity com throttle de 5 minutos para não sobrecarregar o banco
      if (session && session.isValid) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (!session.lastActivity || (session.lastActivity as Date) < fiveMinutesAgo) {
          Session.updateOne({ tokenJti: req.user.jti }, { lastActivity: new Date() }).catch(() => {});
        }
      }
    }

    // Verificar assinatura bloqueada (somente para role=admin, pois sub-users herdam do admin)
    // Rotas isentas: /auth/*, /admin/*, /stripe/* (para poder assinar mesmo bloqueado)
    const isExemptRoute = req.path.startsWith('/auth') || req.path.startsWith('/admin') || req.path.startsWith('/stripe');
    if (!isExemptRoute && req.user.role === 'admin') {
      const tenant = await User.findById(req.user._id).select('dataVencimento statusAssinatura role').lean();
      if (tenant && (tenant as any).dataVencimento) {
        const vencimento = new Date((tenant as any).dataVencimento);
        const now = new Date();
        if (vencimento < now) {
          const diasVencidos = Math.floor((now.getTime() - vencimento.getTime()) / (24 * 60 * 60 * 1000));
          const isTeste = (tenant as any).statusAssinatura === 'teste';
          // Teste gratuito: bloqueia imediatamente. Assinatura paga: 3 dias de carência.
          const graceDays = isTeste ? 0 : 3;
          if (diasVencidos > graceDays) {
            return res.status(402).json({
              success: false,
              error: 'Assinatura bloqueada',
              code: 'SUBSCRIPTION_BLOCKED',
              diasVencidos,
              dataVencimento: vencimento.toISOString(),
              statusAssinatura: (tenant as any).statusAssinatura,
            });
          }
        }
      }
    }

    // Para sub-users (caixa/gerente), verifica o admin da empresa
    if (!isExemptRoute && req.user.role !== 'admin' && req.user.empresaId) {
      const adminTenant = await User.findById(req.user.empresaId).select('dataVencimento statusAssinatura').lean();
      if (adminTenant && (adminTenant as any).dataVencimento) {
        const vencimento = new Date((adminTenant as any).dataVencimento);
        const now = new Date();
        if (vencimento < now) {
          const diasVencidos = Math.floor((now.getTime() - vencimento.getTime()) / (24 * 60 * 60 * 1000));
          const isTeste = (adminTenant as any).statusAssinatura === 'teste';
          const graceDays = isTeste ? 0 : 3;
          if (diasVencidos > graceDays) {
            return res.status(402).json({
              success: false,
              error: 'Assinatura bloqueada',
              code: 'SUBSCRIPTION_BLOCKED',
              diasVencidos,
              dataVencimento: vencimento.toISOString(),
              statusAssinatura: (adminTenant as any).statusAssinatura,
            });
          }
        }
      }
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
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Sem permissão para acessar este recurso' });
    }
    next();
  };
};
