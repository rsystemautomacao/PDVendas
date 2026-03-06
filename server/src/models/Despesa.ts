import mongoose, { Schema } from 'mongoose';

const despesaSchema = new Schema(
  {
    nome: { type: String, required: [true, 'Nome é obrigatório'] },
    fornecedor: String,
    tipo: { type: String, enum: ['fixa', 'variavel'], default: 'variavel' },
    valor: { type: Number, required: [true, 'Valor é obrigatório'], min: 0 },
    vencimento: { type: String, required: [true, 'Vencimento é obrigatório'] },
    pago: { type: Boolean, default: false },
    pagoEm: String,
    observacoes: String,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

export const Despesa = mongoose.model('Despesa', despesaSchema);
