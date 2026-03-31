import mongoose, { Schema } from 'mongoose';

const contaPagarSchema = new Schema(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    descricao: { type: String, required: [true, 'Descrição é obrigatória'] },
    fornecedor: String,
    valor: { type: Number, required: [true, 'Valor é obrigatório'], min: 0 },
    valorPago: { type: Number, default: 0, min: 0 },
    vencimento: { type: String, required: [true, 'Vencimento é obrigatório'] },
    pago: { type: Boolean, default: false },
    pagoEm: String,
    categoria: String,
    observacoes: String,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

export const ContaPagar = mongoose.model('ContaPagar', contaPagarSchema);
