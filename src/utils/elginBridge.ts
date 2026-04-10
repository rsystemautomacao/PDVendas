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
 * Imprime via Android Bridge (WebView JavaScript Interface).
 * Funciona quando o app esta hospedado em um WebView que expoe
 * window.AndroidPrinter ou window.ElginPrinter.
 */
function imprimirViaAndroidBridge(dados: string): boolean {
  try {
    // Tenta a interface padrao do Elgin
    if (window.ElginPrinter) {
      return window.ElginPrinter.imprimirTexto(dados)
    }
    // Tenta a interface generica Android
    if (window.AndroidPrinter) {
      return window.AndroidPrinter.printText(dados)
    }
    return false
  } catch (err) {
    console.error('[ElginBridge] Erro no Android Bridge:', err)
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
 * Tenta imprimir via servico HTTP local com dados raw/binarios (ESC/POS).
 */
async function imprimirRawViaHttp(dados: Uint8Array, config: ConfigBridge): Promise<boolean> {
  const url = `${config.httpUrl}${config.httpEndpoint}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), BRIDGE_TIMEOUT)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: dados,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    return response.ok
  } catch (err) {
    clearTimeout(timeout)
    console.error('[ElginBridge] Erro HTTP raw:', err)
    return false
  }
}

/**
 * Funcao principal: envia dados ESC/POS para a impressora embarcada.
 * Tenta automaticamente o melhor metodo disponivel.
 *
 * @param escposData - String com comandos ESC/POS
 * @returns true se imprimiu com sucesso, false se falhou
 */
export async function imprimirEmbarcada(escposData: string): Promise<boolean> {
  const config = getBridgeConfig()

  // 1. Tenta Android Bridge (mais rapido, sem rede)
  if (config.modo === 'android-bridge' || hasAndroidBridge()) {
    const ok = imprimirViaAndroidBridge(escposData)
    if (ok) return true
    // Se falhou, tenta HTTP como fallback
  }

  // 2. Tenta HTTP local
  if (config.modo === 'http-local' || config.httpUrl) {
    const ok = await imprimirViaHttp(escposData, config)
    if (ok) return true
  }

  return false
}

/**
 * Envia dados raw (Uint8Array) para a impressora.
 */
export async function imprimirRawEmbarcada(rawData: Uint8Array): Promise<boolean> {
  const config = getBridgeConfig()

  if (config.modo === 'android-bridge' || hasAndroidBridge()) {
    // Converte para string para o bridge
    let str = ''
    for (let i = 0; i < rawData.length; i++) {
      str += String.fromCharCode(rawData[i])
    }
    const ok = imprimirViaAndroidBridge(str)
    if (ok) return true
  }

  if (config.modo === 'http-local' || config.httpUrl) {
    const ok = await imprimirRawViaHttp(rawData, config)
    if (ok) return true
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
