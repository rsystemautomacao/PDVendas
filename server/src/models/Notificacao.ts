import mongoose, { Schema } from 'mongoose';

const notificacaoSchema = new Schema(
  {
    titulo: { type: String, required: true },
    mensagem: { type: String, required: true },
    tipo: { type: String, enum: ['info', 'sucesso', 'alerta', 'erro'], default: 'info' },
    lida: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

export const Notificacao = mongoose.model('Notificacao', notificacaoSchema);
