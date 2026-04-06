import mongoose, { Schema } from 'mongoose';

// Sub-schema para variações (tamanho/cor)
const variacaoSchema = new Schema(
  {
    tamanho: String,
    cor: String,
    sku: String,
    codigoBarras: String,
    preco: Number, // preço específico desta variação (opcional, usa o do produto se vazio)
    estoque: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

// Sub-schema para números de série
const serialSchema = new Schema(
  {
    numero: { type: String, required: true },
    status: { type: String, enum: ['disponivel', 'vendido', 'garantia', 'defeito'], default: 'disponivel' },
    vendaId: { type: Schema.Types.ObjectId, ref: 'Venda' },
    dataVenda: Date,
    garantiaAte: Date,
    observacoes: String,
  },
  { _id: true }
);

// Sub-schema para especificações técnicas
const especificacaoSchema = new Schema(
  {
    chave: { type: String, required: true },
    valor: { type: String, required: true },
  },
  { _id: false }
);

const produtoSchema = new Schema(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nome: { type: String, required: [true, 'Nome é obrigatório'] },
    codigo: { type: String, required: [true, 'Código é obrigatório'] },
    codigoBarras: String,
    tipo: { type: String, enum: ['produto', 'servico'], default: 'produto' },
    modoVenda: { type: String, enum: ['normal', 'balanca'], default: 'normal' },
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

    // === Novos campos para roupas e informática ===

    // Controle de variações (roupas: tamanho/cor, informática: configurações)
    temVariacoes: { type: Boolean, default: false },
    variacoes: [variacaoSchema],
    tamanhosPadrao: [String], // lista de tamanhos usados (PP, P, M, G, GG, EG)
    coresPadrao: [String],    // lista de cores usadas

    // Controle de número de série (informática/eletrônicos)
    temSerial: { type: Boolean, default: false },
    seriais: [serialSchema],

    // Garantia
    garantiaMeses: { type: Number, min: 0 },
    garantiaTipo: { type: String, enum: ['fabricante', 'loja', 'estendida', ''] },

    // Especificações técnicas (informática)
    especificacoes: [especificacaoSchema],

    // Categoria do produto
    categoria: { type: String, enum: [
      '', 'roupas', 'calcados', 'acessorios',
      'informatica', 'celulares', 'eletronicos', 'eletrodomesticos',
      'alimentos', 'bebidas', 'limpeza', 'outros'
    ], default: '' },

    // Campos extras para roupas
    genero: { type: String, enum: ['', 'masculino', 'feminino', 'unissex', 'infantil'], default: '' },
    material: String,
    colecao: String,

    // Preco atacado
    precoAtacado: { type: Number, min: 0 },
    qtdMinimaAtacado: { type: Number, min: 1 },

    // Controle de validade
    validade: String,
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
  }
);

produtoSchema.index({ nome: 'text', codigo: 'text', codigoBarras: 'text' });

export const Produto = mongoose.model('Produto', produtoSchema);
