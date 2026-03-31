import mongoose, { Schema } from 'mongoose';

const movimentacaoCaixaSchema = new Schema({
  tipo: {
    type: String,
    enum: ['reforco', 'sangria', 'venda', 'estorno'],
    required: true,
  },
  valor: { type: Number, required: true },
  descricao: { type: String, default: '' },
  criadoEm: { type: Date, default: Date.now },
});

const caixaSchema = new Schema({
  empresaId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  numero: { type: Number, required: true },
  operadorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  operadorNome: { type: String, required: true },
  status: { type: String, enum: ['aberto', 'fechado'], default: 'aberto' },
  valorAbertura: { type: Number, required: true, min: 0 },
  valorFechamento: Number,
  totalVendas: { type: Number, default: 0 },
  totalEntradas: { type: Number, default: 0 },
  totalSaidas: { type: Number, default: 0 },
  movimentacoes: [movimentacaoCaixaSchema],
  abertoEm: { type: Date, default: Date.now },
  fechadoEm: Date,
  observacoes: String,
});

caixaSchema.index({ empresaId: 1, numero: 1 }, { unique: true });

export const Caixa = mongoose.model('Caixa', caixaSchema);
