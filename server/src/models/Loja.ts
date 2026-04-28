import mongoose, { Schema } from 'mongoose';

const lojaSchema = new Schema(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nome: { type: String, required: [true, 'Nome da loja e obrigatorio'] },
    endereco: String,
    cidade: String,
    estado: String,
    telefone: String,
    ativa: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

lojaSchema.index({ empresaId: 1, nome: 1 });

export const Loja = mongoose.model('Loja', lojaSchema);
