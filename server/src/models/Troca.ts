import mongoose, { Schema } from 'mongoose';

const itemTrocaSchema = new Schema(
  {
    produtoId: { type: Schema.Types.ObjectId, ref: 'Produto', required: true },
    nome: String,
    codigo: String,
    quantidade: { type: Number, required: true, min: 0.001 },
    precoUnitario: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const trocaSchema = new Schema(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    numero: { type: Number, required: true },
    vendaId: { type: Schema.Types.ObjectId, ref: 'Venda', required: true },
    vendaNumero: { type: Number, required: true },
    clienteNome: String,
    tipo: {
      type: String,
      enum: ['troca', 'devolucao'],
      required: true,
    },
    itensDevolvidos: [itemTrocaSchema],
    itensNovos: [itemTrocaSchema],
    totalDevolvido: { type: Number, required: true, min: 0 },
    totalNovo: { type: Number, default: 0, min: 0 },
    diferenca: { type: Number, default: 0 }, // positivo = cliente paga, negativo = loja devolve
    motivo: { type: String, required: true },
    observacoes: String,
    status: {
      type: String,
      enum: ['pendente', 'aprovada', 'recusada'],
      default: 'pendente',
    },
    aprovadoPor: String,
    operadorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    operadorNome: String,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
  }
);

trocaSchema.index({ empresaId: 1, numero: 1 }, { unique: true });

export const Troca = mongoose.model('Troca', trocaSchema);
