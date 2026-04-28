import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { Notificacao } from '../models/Notificacao';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

function generateToken(user: any): { token: string; jti: string } {
  const empresaId = user.role === 'admin'
    ? user._id.toString()
    : (user.adminId ? user.adminId.toString() : user._id.toString());

  const jti = crypto.randomUUID();

  const token = jwt.sign(
    { _id: user._id.toString(), email: user.email, role: user.role, empresaId, jti },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );

  return { token, jti };
}

function getTokenExpiresAt(): Date {
  // Parse JWT_EXPIRES_IN (e.g., '7d', '24h')
  const val = env.JWT_EXPIRES_IN;
  const num = parseInt(val);
  const unit = val.replace(/\d/g, '');
  const ms = unit === 'd' ? num * 86400000 : unit === 'h' ? num * 3600000 : num * 60000;
  return new Date(Date.now() + ms);
}

/**
 * Retorna o filtro para sessões genuinamente ativas:
 * - isValid: true
 * - Não expiradas (expiresAt > agora)
 * - Com atividade recente (lastActivity > agora - SESSION_INACTIVITY_HOURS)
 */
function activeSessionFilter(empresaId: string) {
  const now = new Date();
  const inactivityCutoff = new Date(now.getTime() - env.SESSION_INACTIVITY_HOURS * 3600 * 1000);
  return {
    empresaId,
    isValid: true,
    expiresAt: { $gt: now },
    lastActivity: { $gt: inactivityCutoff },
  };
}

/**
 * Invalida sessões expiradas ou abandonadas por inatividade antes de contar.
 * Evita que sessões "fantasma" de browsers fechados bloqueiem novos logins.
 */
async function cleanupStaleSessions(empresaId: string) {
  const now = new Date();
  const inactivityCutoff = new Date(now.getTime() - env.SESSION_INACTIVITY_HOURS * 3600 * 1000);
  await Session.updateMany(
    {
      empresaId,
      isValid: true,
      $or: [
        { expiresAt: { $lte: now } },
        { lastActivity: { $lte: inactivityCutoff } },
      ],
    },
    { isValid: false, invalidatedReason: 'inactivity', invalidatedAt: now },
  );
}

export const authService = {
  async register(data: { nome: string; email: string; senha: string; empresa?: any }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new AppError('Email já cadastrado', 409);

    // Período de teste: 7 dias a partir do cadastro
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 7);

    const user = await User.create({
      ...data,
      dataVencimento,
      statusAssinatura: 'teste',
    });
    const { token, jti } = generateToken(user);

    // Create session
    const empresaId = user._id.toString();
    await Session.create({
      userId: user._id,
      empresaId,
      tokenJti: jti,
      expiresAt: getTokenExpiresAt(),
    });

    // Notificar superadmin sobre novo cadastro
    if (env.SUPERADMIN_EMAIL) {
      const superadmin = await User.findOne({ email: env.SUPERADMIN_EMAIL.toLowerCase() });
      if (superadmin) {
        const empresaNome = data.empresa?.nome ? ` | Empresa: ${data.empresa.nome}` : '';
        await Notificacao.create({
          empresaId: superadmin._id,
          titulo: '🆕 Novo cliente cadastrado!',
          mensagem: `${data.nome} (${data.email}) criou uma nova conta.${empresaNome} Vencimento do teste: ${dataVencimento.toLocaleDateString('pt-BR')}.`,
          tipo: 'info',
          userId: null,
        });
      }
    }

    const json = user.toJSON();
    const empresaSetupComplete = !!(
      user.empresa?.nome &&
      user.empresa?.cnpj &&
      user.empresa.cnpj.replace(/\D/g, '').length === 14
    );
    return { user: { ...json, empresaSetupComplete }, token };
  },

  async login(email: string, senha: string, options?: { forceLogin?: boolean; deviceInfo?: string; ipAddress?: string }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+senha');
    if (!user) throw new AppError('Email ou senha inválidos', 401);
    if (!user.ativo) throw new AppError('Usuário inativo', 403);

    const isMatch = await (user as any).comparePassword(senha);
    if (!isMatch) throw new AppError('Email ou senha inválidos', 401);

    const empresaId = user.role === 'admin'
      ? user._id.toString()
      : (user.adminId ? user.adminId.toString() : user._id.toString());

    // Get tenant to check license limit
    const tenant = user.role === 'admin' ? user : await User.findById(user.adminId);
    const maxLicencas = (tenant as any)?.maxLicencas || 1;

    // Limpa sessões expiradas ou abandonadas antes de contar (evita "sessões fantasma")
    await cleanupStaleSessions(empresaId);

    // Conta apenas sessões genuinamente ativas (não expiradas e com atividade recente)
    const activeSessions = await Session.countDocuments(activeSessionFilter(empresaId));

    // License check
    if (activeSessions >= maxLicencas && !options?.forceLogin) {
      return {
        requiresConfirmation: true,
        activeSessions,
        maxLicencas,
        message: `Limite de ${maxLicencas} licença(s) atingido. ${activeSessions} sessão(ões) ativa(s). Ao continuar, a sessão mais antiga será desconectada.`,
      };
    }

    // If forcing login and over limit, invalidate oldest sessions
    if (activeSessions >= maxLicencas && options?.forceLogin) {
      const sessionsToKill = activeSessions - maxLicencas + 1;
      const oldestSessions = await Session.find(activeSessionFilter(empresaId))
        .sort({ lastActivity: 1 })
        .limit(sessionsToKill)
        .select('_id');

      const idsToKill = oldestSessions.map(s => s._id);
      if (idsToKill.length > 0) {
        await Session.updateMany(
          { _id: { $in: idsToKill } },
          { isValid: false, invalidatedReason: 'license_exceeded', invalidatedAt: new Date() }
        );
      }
    }

    user.ultimoLogin = new Date();
    await user.save();

    const { token, jti } = generateToken(user);

    // Create session
    await Session.create({
      userId: user._id,
      empresaId,
      tokenJti: jti,
      deviceInfo: options?.deviceInfo || '',
      ipAddress: options?.ipAddress || '',
      expiresAt: getTokenExpiresAt(),
    });

    const loginJson = user.toJSON();
    const loginSetupComplete = !!(
      user.empresa?.nome &&
      user.empresa?.cnpj &&
      user.empresa.cnpj.replace(/\D/g, '').length === 14
    );
    return { user: { ...loginJson, empresaSetupComplete: loginSetupComplete }, token };
  },

  async logout(jti: string) {
    if (!jti) return;
    await Session.findOneAndUpdate(
      { tokenJti: jti, isValid: true },
      { isValid: false, invalidatedReason: 'logout', invalidatedAt: new Date() }
    );
  },

  async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('Usuário não encontrado', 404);
    const json = user.toJSON();
    const empresaSetupComplete = !!(
      user.empresa?.nome &&
      user.empresa?.cnpj &&
      user.empresa.cnpj.replace(/\D/g, '').length === 14
    );
    return { ...json, empresaSetupComplete };
  },

  async updateMe(userId: string, data: any) {
    const user = await User.findById(userId).select('+senha');
    if (!user) throw new AppError('Usuário não encontrado', 404);

    if (data.novaSenha) {
      if (!data.senhaAtual) throw new AppError('Senha atual é obrigatória', 400);
      const isMatch = await (user as any).comparePassword(data.senhaAtual);
      if (!isMatch) throw new AppError('Senha atual incorreta', 401);
      user.senha = data.novaSenha;
    }

    if (data.nome) user.nome = data.nome;
    if (data.email) user.email = data.email;
    // role and ativo can only be changed by admin via admin routes, not by the user themselves
    if (data.empresa) user.empresa = { ...(user.empresa as any), ...data.empresa };

    await user.save();
    const json = user.toJSON();
    const empresaSetupComplete = !!(
      user.empresa?.nome &&
      user.empresa?.cnpj &&
      user.empresa.cnpj.replace(/\D/g, '').length === 14
    );
    return { ...json, empresaSetupComplete };
  },

  async requestReset(email: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return { message: 'Se o email existir, um código será gerado' };
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    user.set('resetToken', await bcrypt.hash(token, 10));
    user.set('resetTokenExpires', new Date(Date.now() + 30 * 60 * 1000));
    await user.save();

    // TODO: In production, send token via email instead of returning it
    // For now, return it for development/testing purposes
    if (env.NODE_ENV === 'production') {
      return { message: 'Se o email existir, um código será enviado' };
    }
    return { token, message: 'Código gerado com sucesso' };
  },

  async resetPassword(email: string, token: string, novaSenha: string) {
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+resetToken +resetTokenExpires');
    if (!user || !user.get('resetToken') || !user.get('resetTokenExpires')) {
      throw new AppError('Código inválido ou expirado', 400);
    }
    if ((user.get('resetTokenExpires') as Date) < new Date()) {
      throw new AppError('Código expirado. Solicite um novo.', 400);
    }

    const isValid = await bcrypt.compare(token, user.get('resetToken') as string);
    if (!isValid) throw new AppError('Código inválido', 400);

    user.senha = novaSenha;
    user.set('resetToken', undefined);
    user.set('resetTokenExpires', undefined);
    await user.save();

    return { message: 'Senha alterada com sucesso' };
  },
};
