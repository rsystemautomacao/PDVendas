/**
 * Bridge de comunicacao com impressoras embarcadas (Elgin TPro, etc).
 *
 * Suporta 3 modos de comunicacao:
 *
 * 1. Android Bridge (WebView) - Quando o app roda dentro de um WebView Android
 *    que expoe uma interface JavaScript para comunicacao direta com a impressora.
 *
 * 2. HTTP Local - Um servico Android (bridge) rodando no mesmo dispositivo
 *    que aceita comandos via HTTP (localhost).
 *
 * 3. Elgin E1 Bridge - Servico oficial da Elgin que roda localmente.
 */

const STORAGE_KEY = 'meupdv_impressoras'
const BRIDGE_TIMEOUT = 5000

// ======== TIPOS ========

export type ModoConexao = 'android-bridge' | 'http-local' | 'browser'

export interface ConfigBridge {
  modo: ModoConexao
  httpUrl: string      // URL do servico HTTP local (ex: http://localhost:9100)
  httpEndpoint: string // Endpoint para enviar dados (ex: /print)
}

interface ImpressoraConfig {
  id: string
  nome: string
  tipo: 'cupom' | 'a4' | 'etiqueta' | 'embarcada'
  larguraMm: number
  margemMm: number
  fonteSizePx: number
  ativa: boolean
  padrao: boolean
  imprimirAutomatico: boolean
  copias: number
  bridge?: ConfigBridge
}

// ======== DETECCAO DE AMBIENTE ========

/**
 * Declara a interface do Android Bridge (WebView).
 * O app Android host pode expor: window.AndroidPrinter.print(base64data)
 */
/** Comando estruturado para impressora Elgin */
export interface ComandoImpressao {
  type: 'text' | 'separator' | 'feed' | 'cut' | 'qrcode' | 'barcode' | 'image' | 'init'
  data?: string
  align?: number    // 0=esq, 1=centro, 2=dir
  style?: number    // bitmask: 0=normal, 8=bold, 2=underline, 10=bold+underline
  size?: number     // 0=normal, 1=double-h, 16=double-w, 17=double
  lines?: number
  char?: string
  errorLevel?: number
  height?: number
  width?: number
  tipo?: number
  hri?: number
  path?: string
}

// Constantes de estilo Elgin
export const ELGIN_STYLE = {
  NORMAL: 0,
  FONT_B: 1,
  UNDERLINE: 2,
  REVERSE: 4,
  BOLD: 8,
} as const

export const ELGIN_SIZE = {
  NORMAL: 0,
  DOUBLE_H: 1,
  DOUBLE_W: 16,
  DOUBLE: 17,
} as const

declare global {
  interface Window {
    AndroidPrinter?: {
      print: (data: string) => boolean
      printText: (text: string) => boolean
      getStatus: () => string
      cutPaper: () => boolean
    }
    ElginPrinter?: {
      imprimir: (dados: string) => boolean
      imprimirTexto: (texto: string) => boolean
      cortarPapel: () => boolean
      getStatus: () => string
      getVersao: () => string
      setColunas: (cols: number) => void
    }
  }
}

/** Verifica se estamos rodando dentro de um WebView Android com bridge */
export function hasAndroidBridge(): boolean {
  return !!(window.AndroidPrinter || window.ElginPrinter)
}

/** Detecta o modo de conexao mais provavel */
export function detectarModoConexao(): ModoConexao {
  if (hasAndroidBridge()) return 'android-bridge'
  return 'browser'
}

// ======== CONFIGURACAO ========

export function getBridgeConfig(): ConfigBridge {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const lista: ImpressoraConfig[] = JSON.parse(saved)
      const embarcada = lista.find(p => p.tipo === 'embarcada' && p.ativa)
      if (embarcada?.bridge) return embarcada.bridge
    }
  } catch { /* ignore */ }
  return {
    modo: detectarModoConexao(),
    httpUrl: 'http://localhost:9100',
    httpEndpoint: '/print',
  }
}

export function getImpressoraEmbarcada(): ImpressoraConfig | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const lista: ImpressoraConfig[] = JSON.parse(saved)
    return lista.find(p => p.tipo === 'embarcada' && p.ativa) || null
  } catch {
    return null
  }
}

// ======== IMPRESSAO ========

/**
 * Imprime texto simples via Android Bridge.
 */
function imprimirTextoViaBridge(dados: string): boolean {
  try {
    if (window.ElginPrinter) return window.ElginPrinter.imprimirTexto(dados)
    if (window.AndroidPrinter) return window.AndroidPrinter.printText(dados)
    return false
  } catch (err) {
    console.error('[ElginBridge] Erro no Android Bridge:', err)
    return false
  }
}

/**
 * Imprime comandos estruturados (JSON) via Android Bridge.
 * Usa o metodo ElginPrinter.imprimir(json) que chama
 * Termica.ImpressaoTexto() com formatacao completa.
 */
function imprimirComandosViaBridge(comandos: ComandoImpressao[]): boolean {
  try {
    if (window.ElginPrinter?.imprimir) {
      return window.ElginPrinter.imprimir(JSON.stringify(comandos))
    }
    return false
  } catch (err) {
    console.error('[ElginBridge] Erro ao enviar comandos:', err)
    return false
  }
}

/**
 * Imprime via servico HTTP local.
 * Um app Android companion (ou o E1 Bridge da Elgin) precisa estar
 * rodando no mesmo dispositivo, escutando na porta configurada.
 */
async function imprimirViaHttp(dados: string, config: ConfigBridge): Promise<boolean> {
  const url = `${config.httpUrl}${config.httpEndpoint}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), BRIDGE_TIMEOUT)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: dados,
        type: 'text',
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    return response.ok
  } catch (err) {
    clearTimeout(timeout)
    console.error('[ElginBridge] Erro HTTP:', err)
    return false
  }
}


/**
 * Envia texto simples para a impressora embarcada.
 * Tenta Android Bridge primeiro, depois HTTP local.
 */
export async function imprimirEmbarcada(texto: string): Promise<boolean> {
  const config = getBridgeConfig()

  // 1. Tenta Android Bridge (mais rapido, sem rede)
  if (config.modo === 'android-bridge' || hasAndroidBridge()) {
    const ok = imprimirTextoViaBridge(texto)
    if (ok) return true
  }

  // 2. Tenta HTTP local
  if (config.modo === 'http-local' || config.httpUrl) {
    const ok = await imprimirViaHttp(texto, config)
    if (ok) return true
  }

  return false
}

/**
 * Envia comandos estruturados para a impressora embarcada.
 * Usa a API nativa Elgin (ImpressaoTexto com formatacao).
 *
 * Exemplo:
 * ```ts
 * imprimirComandos([
 *   { type: 'text', data: 'TITULO\n', align: 1, style: ELGIN_STYLE.BOLD, size: ELGIN_SIZE.DOUBLE },
 *   { type: 'separator' },
 *   { type: 'text', data: 'Item 1     R$ 10,00\n', align: 0 },
 *   { type: 'cut' },
 * ])
 * ```
 */
export async function imprimirComandos(comandos: ComandoImpressao[]): Promise<boolean> {
  const config = getBridgeConfig()

  // 1. Tenta Android Bridge com comandos estruturados
  if (config.modo === 'android-bridge' || hasAndroidBridge()) {
    const ok = imprimirComandosViaBridge(comandos)
    if (ok) return true
  }

  // 2. HTTP local com JSON
  if (config.modo === 'http-local' || config.httpUrl) {
    const url = `${config.httpUrl}${config.httpEndpoint}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), BRIDGE_TIMEOUT)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: comandos }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (response.ok) return true
    } catch {
      clearTimeout(timeout)
    }
  }

  return false
}

/**
 * Testa a conexao com a impressora embarcada.
 * Retorna um objeto com status e mensagem.
 */
export async function testarConexao(): Promise<{ ok: boolean; modo: string; mensagem: string }> {
  // 1. Tenta Android Bridge
  if (hasAndroidBridge()) {
    try {
      const status = window.ElginPrinter?.getStatus?.() || window.AndroidPrinter?.getStatus?.()
      return {
        ok: true,
        modo: 'Android Bridge',
        mensagem: `Conectada via WebView. Status: ${status || 'OK'}`,
      }
    } catch {
      return { ok: false, modo: 'Android Bridge', mensagem: 'Bridge detectada mas com erro' }
    }
  }

  // 2. Tenta HTTP local
  const config = getBridgeConfig()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const response = await fetch(`${config.httpUrl}/status`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (response.ok) {
      const data = await response.text()
      return {
        ok: true,
        modo: 'HTTP Local',
        mensagem: `Servico respondendo em ${config.httpUrl}. ${data}`,
      }
    }
    return {
      ok: false,
      modo: 'HTTP Local',
      mensagem: `Servico retornou status ${response.status}`,
    }
  } catch {
    return {
      ok: false,
      modo: 'HTTP Local',
      mensagem: `Nenhum servico encontrado em ${config.httpUrl}. Verifique se o app bridge esta rodando.`,
    }
  }
}

/**
 * Verifica se existe uma impressora embarcada configurada e ativa.
 */
export function temImpressoraEmbarcada(): boolean {
  return getImpressoraEmbarcada() !== null
}

// ======== BUILDER DE COMANDOS ========

/**
 * Builder fluente para montar array de comandos estruturados.
 * Facilita a criacao de recibos formatados.
 *
 * Exemplo:
 * ```ts
 * const cmds = new ElginBuilder()
 *   .centro().bold().duplo().texto('MINHA LOJA\n')
 *   .normal().separador()
 *   .esquerda().texto('Item 1\n')
 *   .esquerdaDireita('  1 x R$ 10,00', 'R$ 10,00')
 *   .separador('=')
 *   .bold().duplo_h().esquerdaDireita('TOTAL:', 'R$ 10,00')
 *   .cortarPapel()
 *   .build()
 *
 * imprimirComandos(cmds)
 * ```
 */
export class ElginBuilder {
  private cmds: ComandoImpressao[] = []
  private _align = 0
  private _style = 0
  private _size = 0
  private colunas: number

  constructor(colunas = 48) {
    this.colunas = colunas
  }

  // Alinhamento
  esquerda(): this { this._align = 0; return this }
  centro(): this { this._align = 1; return this }
  direita(): this { this._align = 2; return this }

  // Estilos
  bold(on = true): this {
    if (on) this._style |= ELGIN_STYLE.BOLD
    else this._style &= ~ELGIN_STYLE.BOLD
    return this
  }
  sublinhado(on = true): this {
    if (on) this._style |= ELGIN_STYLE.UNDERLINE
    else this._style &= ~ELGIN_STYLE.UNDERLINE
    return this
  }

  // Tamanhos
  normal(): this { this._size = ELGIN_SIZE.NORMAL; this._style = 0; return this }
  duplo(): this { this._size = ELGIN_SIZE.DOUBLE; return this }
  duplo_h(): this { this._size = ELGIN_SIZE.DOUBLE_H; return this }
  duplo_w(): this { this._size = ELGIN_SIZE.DOUBLE_W; return this }

  /** Imprime texto com formatacao atual */
  texto(str: string): this {
    this.cmds.push({
      type: 'text',
      data: str,
      align: this._align,
      style: this._style,
      size: this._size,
    })
    return this
  }

  /** Linha separadora */
  separador(char = '-'): this {
    this.cmds.push({ type: 'separator', char })
    return this
  }

  /** Texto alinhado a esquerda e a direita na mesma linha */
  esquerdaDireita(left: string, right: string): this {
    const spaces = this.colunas - left.length - right.length
    const line = spaces > 0
      ? left + ' '.repeat(spaces) + right
      : left.substring(0, this.colunas - right.length - 1) + ' ' + right
    this.cmds.push({
      type: 'text',
      data: line + '\n',
      align: 0,
      style: this._style,
      size: this._size,
    })
    return this
  }

  /** Avancar papel */
  alimentar(lines = 3): this {
    this.cmds.push({ type: 'feed', lines })
    return this
  }

  /** Cortar papel */
  cortarPapel(): this {
    this.cmds.push({ type: 'feed', lines: 3 })
    this.cmds.push({ type: 'cut' })
    return this
  }

  /** QR Code */
  qrcode(data: string, size = 4): this {
    this.cmds.push({ type: 'qrcode', data, size })
    return this
  }

  /** Retorna o array de comandos */
  build(): ComandoImpressao[] {
    return [...this.cmds]
  }
}
