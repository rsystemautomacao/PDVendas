import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

export const userService = {
  // List sub-users of an admin
  async list(adminId: string) {
    const users = await User.find({ adminId }).sort({ criadoEm: -1 });
    return users.map((u) => u.toJSON());
  },

  // Get a single sub-user (must belong to admin)
  async getById(adminId: string, userId: string) {
    const user = await User.findOne({ _id: userId, adminId });
    if (!user) throw new AppError('Usuário não encontrado', 404);
    return user.toJSON();
  },

  // Create a sub-user under an admin
  async create(adminId: string, data: { nome: string; email: string; senha: string; role: string; permissoes?: Record<string, boolean> }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new AppError('Email já cadastrado', 409);

    // Get admin to inherit empresa data
    const admin = await User.findById(adminId);
    if (!admin) throw new AppError('Admin não encontrado', 404);

    const user = await User.create({
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      role: data.role || 'caixa',
      adminId,
      empresa: admin.empresa,
      permissoes: data.permissoes || {},
    });

    return user.toJSON();
  },

  // Update a sub-user
  async update(adminId: string, userId: string, data: { nome?: string; email?: string; role?: string; ativo?: boolean; permissoes?: Record<string, boolean>; novaSenha?: string }) {
    const user = await User.findOne({ _id: userId, adminId });
    if (!user) throw new AppError('Usuário não encontrado', 404);

    if (data.nome) user.nome = data.nome;
    if (data.email) user.email = data.email;
    if (data.role) user.role = data.role as any;
    if (data.ativo !== undefined) user.ativo = data.ativo;
    if (data.permissoes) user.set('permissoes', data.permissoes);
    if (data.novaSenha) user.senha = data.novaSenha;

    await user.save();
    return user.toJSON();
  },

  // Delete a sub-user
  async remove(adminId: string, userId: string) {
    const user = await User.findOneAndDelete({ _id: userId, adminId });
    if (!user) throw new AppError('Usuário não encontrado', 404);
    return { message: 'Usuário removido com sucesso' };
  },
};
