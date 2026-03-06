import { Notificacao } from '../models/Notificacao';
import { AppError } from '../middleware/errorHandler';

export const notificacaoService = {
  async list(userId: string) {
    return Notificacao.find({ $or: [{ userId }, { userId: null }] }).sort({ criadoEm: -1 });
  },

  async markRead(id: string) {
    const n = await Notificacao.findByIdAndUpdate(id, { lida: true }, { new: true });
    if (!n) throw new AppError('Notificação não encontrada', 404);
    return n;
  },

  async markAllRead(userId: string) {
    await Notificacao.updateMany(
      { $or: [{ userId }, { userId: null }], lida: false },
      { lida: true }
    );
    return { message: 'Todas marcadas como lidas' };
  },

  async remove(id: string) {
    const n = await Notificacao.findByIdAndDelete(id);
    if (!n) throw new AppError('Notificação não encontrada', 404);
    return n;
  },

  async removeAllRead(userId: string) {
    await Notificacao.deleteMany({
      $or: [{ userId }, { userId: null }],
      lida: true,
    });
    return { message: 'Notificações lidas removidas' };
  },
};
