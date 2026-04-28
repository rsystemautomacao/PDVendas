import { temImpressoraEmbarcada, imprimirEmbarcada, imprimirComandos, ElginBuilder, hasAndroidBridge } from './elginBridge'

const STORAGE_KEY = 'meupdv_impressoras'

interface Impressora {
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
}

export function getImpressoraPadrao(): Impressora | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const lista: Impressora[] = JSON.parse(saved)
    return lista.find(p => p.padrao && p.ativa) || lista.find(p => p.ativa) || null
  } catch {
    return null
  }
}

/**
 * Imprime usando iframe oculto na mesma pagina.
 * Vantagem: o navegador lembra a ultima impressora selecionada por origem,
 * entao o usuario so precisa escolher a impressora na primeira vez.
 */
function imprimirViaIframe(html: string, onAfterPrint?: () => void) {
  const FRAME_ID = 'meupdv-print-frame'
  let iframe = document.getElementById(FRAME_ID) as HTMLIFrameElement | null
  if (!iframe) {
    iframe = document.createElement('iframe')
    iframe.id = FRAME_ID
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;'
    document.body.appendChild(iframe)
  }

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  const win = iframe.contentWindow
  if (!win) return

  const handleAfterPrint = () => {
    win.removeEventListener('afterprint', handleAfterPrint)
    onAfterPrint?.()
  }
  win.addEventListener('afterprint', handleAfterPrint)

  setTimeout(() => win.print(), 300)
}

/**
 * Imprime recibo. Aceita HTML (para navegador) ou ESC/POS (para embarcada).
 * Se a impressora padrao for embarcada e escposData for fornecido,
 * envia direto para a impressora sem dialogo do navegador.
 */
export function imprimirRecibo(reciboHtml: string, escposData?: string, logoBase64?: string) {
  const impressora = getImpressoraPadrao()

  // Se tem impressora embarcada, envia via bridge
  if (impressora?.tipo === 'embarcada' && (temImpressoraEmbarcada() || hasAndroidBridge())) {
    const copias = impressora.copias || 1

    if (escposData) {
      // Dados ESC/POS prontos — envia direto como texto
      for (let i = 0; i < copias; i++) {
        imprimirEmbarcada(escposData).catch(err =>
          console.error('[Impressao] Erro na impressora embarcada:', err)
        )
      }
    } else {
      // Converte HTML para comandos estruturados (com suporte a logo)
      const comandos = htmlParaComandosElgin(reciboHtml, logoBase64)
      for (let i = 0; i < copias; i++) {
        imprimirComandos(comandos).catch(err =>
          console.error('[Impressao] Erro na impressora embarcada:', err)
        )
      }
    }
    return
  }

  // Defaults para cupom 80mm caso nao haja impressora configurada
  const larguraMm = impressora?.larguraMm ?? 80
  const margemMm = impressora?.margemMm ?? 4
  const fonteSizePx = impressora?.fonteSizePx ?? 12
  const isCupom = impressora ? impressora.tipo === 'cupom' : true
  const copias = impressora?.copias ?? 1

  const larguraPx = Math.round((larguraMm / 25.4) * 72)

  const conteudo = `
    <html>
    <head>
      <title>Recibo - MeuPDV</title>
      <style>
        @page {
          size: ${larguraMm}mm auto;
          margin: ${margemMm}mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: ${fonteSizePx}px;
          ${isCupom ? `width: ${larguraPx}px;` : ''}
          margin: 0 auto;
          color: #000;
        }
        .linha { border-top: 1px dashed #000; margin: 4px 0; }
        .centro { text-align: center; }
        .direita { text-align: right; }
        .bold { font-weight: bold; }
        img { max-height: 60px; max-width: ${Math.round(larguraPx * 0.7)}px; display: block; margin: 0 auto 4px; }
      </style>
    </head>
    <body>
      ${reciboHtml}
    </body>
    </html>
  `

  let impressas = 0

  const printNext = () => {
    impressas++
    if (impressas < copias) {
      imprimirViaIframe(conteudo, () => setTimeout(printNext, 500))
    } else {
      imprimirViaIframe(conteudo)
    }
  }

  printNext()
}

export function deveImprimirAutomatico(): boolean {
  const impressora = getImpressoraPadrao()
  return !!impressora?.imprimirAutomatico
}

/**
 * Converte HTML de recibo em comandos estruturados para impressora Elgin.
 * Extrai texto do HTML e monta comandos com formatação.
 */
function htmlParaComandosElgin(html: string, logoBase64?: string) {
  const builder = new ElginBuilder()

  // Logo da empresa
  if (logoBase64) {
    builder.imagem(logoBase64)
  }

  // Remove tags HTML e converte para texto limpo
  const linhas = html
    .replace(/<div class="linha"><\/div>/gi, '{{SEPARADOR}}')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  for (const linha of linhas) {
    if (linha === '{{SEPARADOR}}') {
      builder.separador()
    } else if (linha.startsWith('TOTAL:') || linha.startsWith('TOTAL ')) {
      builder.bold().duplo_h().texto(linha + '\n').normal()
    } else {
      builder.normal().texto(linha + '\n')
    }
  }

  builder.cortarPapel()
  return builder.build()
}
