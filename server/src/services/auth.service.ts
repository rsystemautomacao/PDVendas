import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

function generateToken(user: any): string {
  const empresaId = user.role === 'admin'
    ? user._id.toString()
    : (user.adminId ? user.adminId.toString() : user._id.toString());

  return jwt.sign(
    { _id: user._id.toString(), email: user.email, role: user.role, empresaId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}

export const authService = {
  async register(data: { nome: string; email: string; senha: string; empresa?: any }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new AppError('Email já cadastrado', 409);

    const user = await User.create(data);
    const token = generateToken(user);
    const json = user.toJSON();
    const empresaSetupComplete = !!(
      user.empresa?.nome &&
      user.empresa?.cnpj &&
      user.empresa.cnpj.replace(/\D/g, '').length === 14
    );
    return { user: { ...json, empresaSetupComplete }, token };
  },

  async login(email: string, senha: string) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+senha');
    if (!user) throw new AppError('Email ou senha inválidos', 401);
    if (!user.ativo) throw new AppError('Usuário inativo', 403);

    const isMatch = await (user as any).comparePassword(senha);
    if (!isMatch) throw new AppError('Email ou senha inválidos', 401);

    user.ultimoLogin = new Date();
    await user.save();

    const token = generateToken(user);
    const loginJson = user.toJSON();
    const loginSetupComplete = !!(
      user.empresa?.nome &&
      user.empresa?.cnpj &&
      user.empresa.cnpj.replace(/\D/g, '').length === 14
    );
    return { user: { ...loginJson, empresaSetupComplete: loginSetupComplete }, token };
  },

  async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('Usuário não encontrado', 404);
    const json = user.toJSON();
    // Verificar se perfil da empresa esta completo
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

    // Trocar senha
    if (data.novaSenha) {
      if (!data.senhaAtual) throw new AppError('Senha atual é obrigatória', 400);
      const isMatch = await (user as any).comparePassword(data.senhaAtual);
      if (!isMatch) throw new AppError('Senha atual incorreta', 401);
      user.senha = data.novaSenha;
    }

    if (data.nome) user.nome = data.nome;
    if (data.email) user.email = data.email;
    if (data.role) user.role = data.role;
    if (data.ativo !== undefined) user.ativo = data.ativo;
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
      // Retorna sucesso mesmo se email não existe (segurança)
      return { message: 'Se o email existir, um código será gerado' };
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    user.set('resetToken', await bcrypt.hash(token, 10));
    user.set('resetTokenExpires', new Date(Date.now() + 30 * 60 * 1000)); // 30 min
    await user.save();

    // Temporário: retorna token na resposta (futuro: enviar por email)
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
