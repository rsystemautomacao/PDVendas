// ==========================================
// MeuPDV - Tipos do Sistema
// Preparado para migração MongoDB Atlas
// ==========================================

// ---- Usuário / Autenticação ----
export interface User {
  _id: string
  nome: string
  email: string
  senha: string // hash
  role: 'admin' | 'caixa' | 'gerente'
  ativo: boolean
  criadoEm: string
  ultimoLogin?: string
  empresa?: EmpresaInfo
  empresaSetupComplete?: boolean
  adminId?: string
  permissoes?: Record<string, boolean>
  comissao?: number
}

export type SegmentoEmpresa =
  | '' | 'varejo_geral' | 'roupas_calcados' | 'informatica_eletronicos'
  | 'alimentos_bebidas' | 'materiais_construcao' | 'pet_shop'
  | 'papelaria' | 'farmacia' | 'otica' | 'assistencia_tecnica'
  | 'auto_pecas' | 'oficina_mecanica' | 'outro'

export interface EmpresaInfo {
  nome: string
  cnpj?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  logoBase64?: string
  segmento?: SegmentoEmpresa
}

// ---- Produto ----
export interface VariacaoProduto {
  _id?: string
  tamanho?: string
  cor?: string
  sku?: string
  codigoBarras?: string
  preco?: number
  estoque: number
}

export interface SerialProduto {
  _id?: string
  numero: string
  status: 'disponivel' | 'vendido' | 'garantia' | 'defeito'
  vendaId?: string
  dataVenda?: string
  garantiaAte?: string
  observacoes?: string
}

export interface EspecificacaoProduto {
  chave: string
  valor: string
}

export interface Produto {
  _id: string
  nome: string
  codigo: string
  codigoBarras?: string
  tipo: 'produto' | 'servico'
  modoVenda: 'normal' | 'balanca'
  preco: number
  precoCusto?: number
  estoque: number
  estoqueMinimo: number
  unidade: 'UN' | 'KG' | 'L' | 'CX' | 'M' | 'PCT'
  grupo?: string
  marca?: string
  fornecedor?: string
  ativo: boolean
  observacoes?: string
  // Variações (roupas)
  temVariacoes?: boolean
  variacoes?: VariacaoProduto[]
  tamanhosPadrao?: string[]
  coresPadrao?: string[]
  // Seriais (informática)
  temSerial?: boolean
  seriais?: SerialProduto[]
  // Garantia
  garantiaMeses?: number
  garantiaTipo?: 'fabricante' | 'loja' | 'estendida' | ''
  // Especificações
  especificacoes?: EspecificacaoProduto[]
  // Categoria e roupas
  categoria?: string
  genero?: '' | 'masculino' | 'feminino' | 'unissex' | 'infantil'
  material?: string
  colecao?: string
  validade?: string
  criadoEm: string
  atualizadoEm: string
}

// ---- Cliente ----
export interface Cliente {
  _id: string
  tipo: 'fisica' | 'juridica'
  nome: string
  email?: string
  telefone?: string
  celular?: string
  cpfCnpj?: string
  rgIe?: string
  dataNascimento?: string
  genero?: string
  endereco?: Endereco
  limiteCredito: number
  saldoDevedor: number
  ativo: boolean
  aprovado: boolean
  observacoes?: string
  criadoEm: string
  atualizadoEm: string
}

export interface Endereco {
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
}

// ---- Venda ----
export interface Venda {
  _id: string
  numero: number
  clienteId?: string
  clienteNome?: string
  itens: ItemVenda[]
  subtotal: number
  desconto: number
  descontoTipo: 'valor' | 'percentual'
  total: number
  pagamentos: Pagamento[]
  troco: number
  status: 'finalizada' | 'orcamento' | 'cancelada'
  caixaId: string
  vendedorId: string
  vendedorNome: string
  observacoes?: string
  criadoEm: string
  canceladoEm?: string
  motivoCancelamento?: string
}

export interface ItemVenda {
  produtoId: string
  nome: string
  codigo: string
  quantidade: number
  precoUnitario: number
  desconto: number
  total: number
  // Variação
  variacaoId?: string
  tamanho?: string
  cor?: string
  // Serial
  serialNumero?: string
  // Garantia
  garantiaAte?: string
}

export interface Pagamento {
  forma: FormaPagamento
  valor: number
  parcelas?: number
  bandeira?: string
}

export type FormaPagamento = 'dinheiro' | 'credito' | 'debito' | 'pix' | 'boleto' | 'crediario'

// ---- Troca / Devolucao ----
export interface ItemTroca {
  produtoId: string
  nome: string
  codigo: string
  quantidade: number
  precoUnitario: number
  total: number
}

export interface Troca {
  _id: string
  numero: number
  vendaId: string
  vendaNumero: number
  clienteNome?: string
  tipo: 'troca' | 'devolucao'
  itensDevolvidos: ItemTroca[]
  itensNovos: ItemTroca[]
  totalDevolvido: number
  totalNovo: number
  diferenca: number
  motivo: string
  observacoes?: string
  status: 'pendente' | 'aprovada' | 'recusada'
  aprovadoPor?: string
  operadorId: string
  operadorNome?: string
  criadoEm: string
}

// ---- Caixa ----
export interface Caixa {
  _id: string
  numero: number
  operadorId: string
  operadorNome: string
  status: 'aberto' | 'fechado'
  valorAbertura: number
  valorFechamento?: number
  totalVendas: number
  totalEntradas: number
  totalSaidas: number
  movimentacoes: MovimentacaoCaixa[]
  abertoEm: string
  fechadoEm?: string
  observacoes?: string
}

export interface MovimentacaoCaixa {
  _id: string
  tipo: 'reforco' | 'sangria' | 'venda' | 'estorno'
  valor: number
  descricao: string
  criadoEm: string
}

// ---- Financeiro ----
export interface ContaPagar {
  _id: string
  descricao: string
  fornecedor?: string
  valor: number
  valorPago: number
  vencimento: string
  pago: boolean
  pagoEm?: string
  categoria?: string
  observacoes?: string
  criadoEm: string
}

export interface ContaReceber {
  _id: string
  descricao: string
  clienteId?: string
  clienteNome?: string
  vendaId?: string
  valor: number
  valorRecebido: number
  vencimento: string
  recebido: boolean
  recebidoEm?: string
  observacoes?: string
  parcela?: number
  totalParcelas?: number
  vendaNumero?: number
  origem?: 'manual' | 'crediario'
  criadoEm: string
}

export interface Despesa {
  _id: string
  nome: string
  fornecedor?: string
  tipo: 'fixa' | 'variavel'
  valor: number
  vencimento: string
  pago: boolean
  pagoEm?: string
  observacoes?: string
  criadoEm: string
}

// ---- Compra ----
export interface Compra {
  _id: string
  numero: number
  fornecedor: string
  itens: ItemCompra[]
  total: number
  status: 'pendente' | 'recebida' | 'cancelada'
  observacoes?: string
  criadoEm: string
  recebidaEm?: string
}

export interface ItemCompra {
  produtoId: string
  nome: string
  quantidade: number
  custoUnitario: number
  total: number
}

// ---- Notificação ----
export interface Notificacao {
  _id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'sucesso' | 'alerta' | 'erro'
  lida: boolean
  criadoEm: string
}

// ---- Log de Atividade ----
export interface LogAtividade {
  _id: string
  usuarioId: string
  usuarioNome: string
  acao: string
  detalhes?: string
  criadoEm: string
}

// ---- Ordem de Serviço (OS) ----
export interface Dispositivo {
  tipo: string
  marca: string
  modelo: string
  cor?: string
  imei?: string
  serial?: string
  senhaDispositivo?: string
  acessorios?: string
  estadoVisual?: string
  // Veículo (oficina mecânica / auto peças)
  placa?: string
  ano?: string
  km?: string
  chassi?: string
  combustivel?: string
  // Animal (pet shop)
  nomeAnimal?: string
  especie?: string
  raca?: string
  porte?: string
  peso?: string
  // Ótica
  grauOD?: string
  grauOE?: string
  // Genérico
  descricaoItem?: string
}

export interface ServicoOS {
  descricao: string
  valor: number
}

export interface PecaOS {
  produtoId?: string
  nome: string
  quantidade: number
  valorUnitario: number
  total: number
}

export type StatusOS =
  | 'aberta'
  | 'em_analise'
  | 'orcamento_enviado'
  | 'aprovada'
  | 'em_execucao'
  | 'concluida'
  | 'entregue'
  | 'cancelada'

export interface OrdemServico {
  _id: string
  numero: number
  clienteId?: string
  clienteNome: string
  clienteTelefone?: string
  dispositivo: Dispositivo
  defeitoRelatado: string
  laudoTecnico?: string
  servicos: ServicoOS[]
  pecas: PecaOS[]
  valorServicos: number
  valorPecas: number
  desconto: number
  total: number
  status: StatusOS
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente'
  tecnicoId?: string
  tecnicoNome?: string
  prazoEstimado?: string
  pagamentos: Pagamento[]
  observacoes?: string
  orcamentoId?: string
  criadoEm: string
  atualizadoEm: string
  concluidaEm?: string
  entregueEm?: string
  canceladaEm?: string
  motivoCancelamento?: string
}

// ---- Orçamento ----
export interface ItemOrcamento {
  tipo: 'servico' | 'peca'
  descricao: string
  produtoId?: string
  quantidade: number
  valorUnitario: number
  total: number
}

export type StatusOrcamento = 'pendente' | 'enviado' | 'aprovado' | 'recusado' | 'expirado' | 'convertido'

export interface Orcamento {
  _id: string
  numero: number
  clienteId?: string
  clienteNome: string
  clienteTelefone?: string
  dispositivo: Dispositivo
  defeitoRelatado: string
  itens: ItemOrcamento[]
  subtotal: number
  desconto: number
  total: number
  validade: number // dias
  status: StatusOrcamento
  osGeradaId?: string
  observacoes?: string
  criadoEm: string
  atualizadoEm: string
  aprovadoEm?: string
  recusadoEm?: string
}

// ---- Toast / Feedback ----
export interface Toast {
  id: string
  tipo: 'sucesso' | 'erro' | 'alerta' | 'info'
  mensagem: string
  duracao?: number
}
