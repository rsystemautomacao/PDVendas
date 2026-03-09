import mongoose, { Schema } from 'mongoose';

const itemCompraSchema = new Schema(
  {
    produtoId: { type: Schema.Types.ObjectId, ref: 'Produto', required: true },
    nome: String,
    quantidade: { type: Number, required: true, min: 0.001 },
    custoUnitario: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const compraSchema = new Schema(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    numero: { type: Number, required: true },
    fornecedor: { type: String, required: [true, 'Fornecedor é obrigatório'] },
    itens: [itemCompraSchema],
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pendente', 'recebida', 'cancelada'], default: 'pendente' },
    observacoes: String,
    recebidaEm: Date,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

compraSchema.index({ empresaId: 1, numero: 1 }, { unique: true });

export const Compra = mongoose.model('Compra', compraSchema);
