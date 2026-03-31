import { Notificacao } from '../models/Notificacao';
import { AppError } from '../middleware/errorHandler';

export const notificacaoService = {
  async list(userId: string, empresaId: string) {
    return Notificacao.find({ empresaId, $or: [{ userId }, { userId: null }] }).sort({ criadoEm: -1 });
  },

  async markRead(id: string, empresaId: string) {
    const n = await Notificacao.findOneAndUpdate({ _id: id, empresaId }, { lida: true }, { new: true });
    if (!n) throw new AppError('Notificação não encontrada', 404);
    return n;
  },

  async markAllRead(userId: string, empresaId: string) {
    await Notificacao.updateMany(
      { empresaId, $or: [{ userId }, { userId: null }], lida: false },
      { lida: true }
    );
    return { message: 'Todas marcadas como lidas' };
  },

  async remove(id: string, empresaId: string) {
    const n = await Notificacao.findOneAndDelete({ _id: id, empresaId });
    if (!n) throw new AppError('Notificação não encontrada', 404);
    return n;
  },

  async removeAllRead(userId: string, empresaId: string) {
    await Notificacao.deleteMany({
      empresaId,
      $or: [{ userId }, { userId: null }],
      lida: true,
    });
    return { message: 'Notificações lidas removidas' };
  },
};
