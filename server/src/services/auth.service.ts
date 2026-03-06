import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

function generateToken(user: any): string {
  return jwt.sign(
    { _id: user._id.toString(), email: user.email, role: user.role },
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
    return { user: user.toJSON(), token };
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
    return { user: user.toJSON(), token };
  },

  async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('Usuário não encontrado', 404);
    return user.toJSON();
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
    return user.toJSON();
  },
};
