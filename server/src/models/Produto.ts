import mongoose, { Schema } from 'mongoose';

const produtoSchema = new Schema(
  {
    nome: { type: String, required: [true, 'Nome é obrigatório'] },
    codigo: { type: String, required: [true, 'Código é obrigatório'] },
    codigoBarras: String,
    tipo: { type: String, enum: ['produto', 'servico'], default: 'produto' },
    preco: { type: Number, required: [true, 'Preço é obrigatório'], min: 0 },
    precoCusto: { type: Number, min: 0 },
    estoque: { type: Number, default: 0, min: 0 },
    estoqueMinimo: { type: Number, default: 5, min: 0 },
    unidade: { type: String, enum: ['UN', 'KG', 'L', 'CX', 'M', 'PCT'], default: 'UN' },
    grupo: String,
    marca: String,
    fornecedor: String,
    ativo: { type: Boolean, default: true },
    observacoes: String,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
  }
);

produtoSchema.index({ nome: 'text', codigo: 'text', codigoBarras: 'text' });

export const Produto = mongoose.model('Produto', produtoSchema);
