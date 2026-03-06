import mongoose, { Schema } from 'mongoose';

const contaReceberSchema = new Schema(
  {
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
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

export const ContaReceber = mongoose.model('ContaReceber', contaReceberSchema);
