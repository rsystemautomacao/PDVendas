import mongoose, { Schema } from 'mongoose';

const contaReceberSchema = new Schema(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    descricao: { type: String, required: [true, 'Descrição é obrigatória'] },
    clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente' },
    clienteNome: String,
    vendaId: { type: Schema.Types.ObjectId, ref: 'Venda' },
    valor: { type: Number, required: [true, 'Valor é obrigatório'], min: 0 },
    valorRecebido: { type: Number, default: 0, min: 0 },
    vencimento: { type: String, required: [true, 'Vencimento é obrigatório'] },
    recebido: { type: Boolean, default: false },
    recebidoEm: String,
    observacoes: String,
    // Campos de parcela (crediario)
    parcela: { type: Number, default: 0 },
    totalParcelas: { type: Number, default: 0 },
    vendaNumero: Number,
    origem: { type: String, enum: ['manual', 'crediario'], default: 'manual' },
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

export const ContaReceber = mongoose.model('ContaReceber', contaReceberSchema);
