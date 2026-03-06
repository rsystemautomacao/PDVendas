import mongoose, { Schema } from 'mongoose';

const logAtividadeSchema = new Schema(
  {
    usuarioId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    usuarioNome: { type: String, required: true },
    acao: { type: String, required: true },
    detalhes: String,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

export const LogAtividade = mongoose.model('LogAtividade', logAtividadeSchema);
