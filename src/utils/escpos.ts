/**
 * Gerador de comandos ESC/POS para impressoras termicas embarcadas.
 * Compativel com Elgin TPro, Epson, Bematech e similares.
 */

// ======== CONSTANTES ESC/POS ========
const ESC = '\x1B'
const GS  = '\x1D'
const LF  = '\x0A'

// Inicializar impressora
const INIT = ESC + '@'

// Alinhamento
const ALIGN_LEFT   = ESC + 'a' + '\x00'
const ALIGN_CENTER = ESC + 'a' + '\x01'
const ALIGN_RIGHT  = ESC + 'a' + '\x02'

// Estilo de fonte
const BOLD_ON      = ESC + 'E' + '\x01'
const BOLD_OFF     = ESC + 'E' + '\x00'
const DOUBLE_W_ON  = GS  + '!' + '\x10'  // largura dupla
const DOUBLE_H_ON  = GS  + '!' + '\x01'  // altura dupla
const DOUBLE_WH_ON = GS  + '!' + '\x11'  // largura + altura dupla
const NORMAL_SIZE  = GS  + '!' + '\x00'

// Cortar papel
const CUT_PARTIAL  = GS + 'V' + '\x01'
const CUT_FULL     = GS + 'V' + '\x00'

type Alinhamento = 'left' | 'center' | 'right'

export class ESCPOSBuilder {
  private buffer: string[] = []
  private colunas: number

  constructor(colunas = 48) {
    this.colunas = colunas
    this.buffer.push(INIT)
  }

  /** Define numero de colunas (32 para 58mm, 48 para 80mm) */
  setColunas(cols: number): this {
    this.colunas = cols
    return this
  }

  /** Alinhamento do texto */
  align(a: Alinhamento): this {
    switch (a) {
      case 'left': this.buffer.push(ALIGN_LEFT); break
      case 'center': this.buffer.push(ALIGN_CENTER); break
      case 'right': this.buffer.push(ALIGN_RIGHT); break
    }
    return this
  }

  /** Ativar/desativar negrito */
  bold(on = true): this {
    this.buffer.push(on ? BOLD_ON : BOLD_OFF)
    return this
  }

  /** Tamanho da fonte: 'normal' | 'double-w' | 'double-h' | 'double' */
  fontSize(size: 'normal' | 'double-w' | 'double-h' | 'double'): this {
    switch (size) {
      case 'normal': this.buffer.push(NORMAL_SIZE); break
      case 'double-w': this.buffer.push(DOUBLE_W_ON); break
      case 'double-h': this.buffer.push(DOUBLE_H_ON); break
      case 'double': this.buffer.push(DOUBLE_WH_ON); break
    }
    return this
  }

  /** Escrever texto com quebra de linha */
  text(str: string): this {
    this.buffer.push(str + LF)
    return this
  }

  /** Escrever texto sem quebra de linha */
  write(str: string): this {
    this.buffer.push(str)
    return this
  }

  /** Linha vazia */
  feed(lines = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(LF)
    }
    return this
  }

  /** Linha separadora tracejada */
  separator(char = '-'): this {
    this.buffer.push(char.repeat(this.colunas) + LF)
    return this
  }

  /** Linha com texto a esquerda e a direita (ex: "Produto 1    R$ 10,00") */
  textLeftRight(left: string, right: string): this {
    const spaces = this.colunas - left.length - right.length
    if (spaces > 0) {
      this.buffer.push(left + ' '.repeat(spaces) + right + LF)
    } else {
      // Truncar o left se nao couber
      const maxLeft = this.colunas - right.length - 1
      this.buffer.push(left.substring(0, maxLeft) + ' ' + right + LF)
    }
    return this
  }

  /** Linha com texto a esquerda, centro e direita */
  textColumns(left: string, center: string, right: string): this {
    const totalContent = left.length + center.length + right.length
    const totalSpaces = this.colunas - totalContent
    if (totalSpaces < 2) {
      this.buffer.push((left + ' ' + center + ' ' + right).substring(0, this.colunas) + LF)
    } else {
      const sLeft = Math.floor(totalSpaces / 2)
      const sRight = totalSpaces - sLeft
      this.buffer.push(left + ' '.repeat(sLeft) + center + ' '.repeat(sRight) + right + LF)
    }
    return this
  }

  /** Cortar papel */
  cut(full = false): this {
    this.buffer.push(full ? CUT_FULL : CUT_PARTIAL)
    return this
  }

  /** Alimentar papel e cortar */
  feedAndCut(lines = 5): this {
    this.feed(lines)
    this.cut()
    return this
  }

  /** Retorna o buffer como string para envio */
  build(): string {
    return this.buffer.join('')
  }

  /** Retorna o buffer como array de bytes (Uint8Array) */
  buildBytes(): Uint8Array {
    const str = this.build()
    const bytes = new Uint8Array(str.length)
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i)
    }
    return bytes
  }

  /** Retorna o buffer como base64 (util para enviar via HTTP JSON) */
  buildBase64(): string {
    return btoa(this.build())
  }
}

// ======== HELPERS PARA RECIBOS ========

function formatCurrency(v: number): string {
  return 'R$ ' + v.toFixed(2).replace('.', ',')
}

interface ItemRecibo {
  nome: string
  quantidade: number
  valorUnitario: number
  total: number
}

interface PagamentoRecibo {
  forma: string
  valor: number
}

interface DadosRecibo {
  empresa: {
    nome?: string
    cnpj?: string
    telefone?: string
    endereco?: string
  }
  numero: number
  data: string
  cliente?: string
  itens: ItemRecibo[]
  subtotal: number
  desconto: number
  total: number
  pagamentos: PagamentoRecibo[]
  troco?: number
  observacoes?: string
  vendedor?: string
}

const formaLabel: Record<string, string> = {
  dinheiro: 'Dinheiro', credito: 'Credito', debito: 'Debito',
  pix: 'PIX', boleto: 'Boleto', crediario: 'Crediario',
}

/** Gera comandos ESC/POS para um recibo de venda */
export function gerarReciboESCPOS(dados: DadosRecibo, colunas = 48): string {
  const b = new ESCPOSBuilder(colunas)

  // Cabecalho da empresa
  b.align('center')
    .bold()
    .fontSize('double')
    .text(dados.empresa.nome || 'MeuPDV')
    .fontSize('normal')
    .bold(false)

  if (dados.empresa.cnpj) b.text(`CNPJ: ${dados.empresa.cnpj}`)
  if (dados.empresa.endereco) b.text(dados.empresa.endereco)
  if (dados.empresa.telefone) b.text(`Tel: ${dados.empresa.telefone}`)

  b.separator('=')
  b.align('center').bold().text(`CUPOM #${dados.numero}`).bold(false)
  b.text(dados.data)
  if (dados.cliente) b.text(`Cliente: ${dados.cliente}`)
  if (dados.vendedor) b.text(`Vendedor: ${dados.vendedor}`)
  b.separator('-')

  // Itens
  b.align('left')
  for (const item of dados.itens) {
    b.text(item.nome)
    b.textLeftRight(
      `  ${item.quantidade} x ${formatCurrency(item.valorUnitario)}`,
      formatCurrency(item.total)
    )
  }

  b.separator('-')

  // Totais
  b.textLeftRight('SUBTOTAL:', formatCurrency(dados.subtotal))
  if (dados.desconto > 0) {
    b.textLeftRight('DESCONTO:', `-${formatCurrency(dados.desconto)}`)
  }
  b.separator('=')
  b.bold()
    .fontSize('double-h')
    .textLeftRight('TOTAL:', formatCurrency(dados.total))
    .fontSize('normal')
    .bold(false)
  b.separator('-')

  // Pagamentos
  b.align('left')
  for (const pag of dados.pagamentos) {
    b.textLeftRight(formaLabel[pag.forma] || pag.forma, formatCurrency(pag.valor))
  }
  if (dados.troco && dados.troco > 0) {
    b.textLeftRight('TROCO:', formatCurrency(dados.troco))
  }

  // Observacoes
  if (dados.observacoes) {
    b.separator('-')
    b.align('left').text(`Obs: ${dados.observacoes}`)
  }

  b.separator('=')
  b.align('center')
    .text('Obrigado pela preferencia!')
    .text(dados.empresa.nome || 'MeuPDV')
    .feedAndCut()

  return b.build()
}

// ======== RECIBO DE OS ========
interface DadosOS {
  empresa: {
    nome?: string
    cnpj?: string
    telefone?: string
    endereco?: string
  }
  numero: number
  cliente: string
  telefoneCliente?: string
  data: string
  status: string
  equipamento: string
  defeito: string
  servicos: { descricao: string; valor: number }[]
  pecas: { nome: string; quantidade: number; valorUnitario: number; total: number }[]
  total: number
  observacoes?: string
}

/** Gera comandos ESC/POS para uma OS (via do cliente) */
export function gerarOSESCPOS(dados: DadosOS, colunas = 48): string {
  const b = new ESCPOSBuilder(colunas)

  // Cabecalho
  b.align('center')
    .bold()
    .fontSize('double')
    .text(dados.empresa.nome || 'MeuPDV')
    .fontSize('normal')
    .bold(false)

  if (dados.empresa.cnpj) b.text(`CNPJ: ${dados.empresa.cnpj}`)
  if (dados.empresa.telefone) b.text(`Tel: ${dados.empresa.telefone}`)

  b.separator('=')
  b.align('center').bold()
    .fontSize('double-h')
    .text(`OS #${dados.numero}`)
    .fontSize('normal')
    .bold(false)
  b.text(`Via do Cliente`)
  b.separator('-')

  // Dados do cliente
  b.align('left')
  b.textLeftRight('Cliente:', dados.cliente)
  if (dados.telefoneCliente) b.textLeftRight('Tel:', dados.telefoneCliente)
  b.textLeftRight('Data:', dados.data)
  b.textLeftRight('Status:', dados.status)
  b.separator('-')

  // Equipamento e defeito
  b.bold().text('EQUIPAMENTO:').bold(false)
  b.text(dados.equipamento)
  b.feed()
  b.bold().text('DEFEITO RELATADO:').bold(false)
  b.text(dados.defeito)
  b.separator('-')

  // Servicos
  if (dados.servicos.length > 0) {
    b.bold().text('SERVICOS:').bold(false)
    for (const s of dados.servicos) {
      b.textLeftRight(s.descricao, formatCurrency(s.valor))
    }
  }

  // Pecas
  if (dados.pecas.length > 0) {
    b.bold().text('PECAS:').bold(false)
    for (const p of dados.pecas) {
      b.text(p.nome)
      b.textLeftRight(`  ${p.quantidade} x ${formatCurrency(p.valorUnitario)}`, formatCurrency(p.total))
    }
  }

  b.separator('=')
  b.bold()
    .fontSize('double-h')
    .textLeftRight('TOTAL:', formatCurrency(dados.total))
    .fontSize('normal')
    .bold(false)

  if (dados.observacoes) {
    b.separator('-')
    b.text(`Obs: ${dados.observacoes}`)
  }

  b.separator('-')
  b.align('center')
    .text('Guarde esta via para retirada.')
    .text('Garantia: 90 dias sobre servico.')
    .feedAndCut()

  return b.build()
}
