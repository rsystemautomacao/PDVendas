const STORAGE_KEY = 'meupdv_impressoras'

interface Impressora {
  id: string
  nome: string
  tipo: 'cupom' | 'a4' | 'etiqueta'
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

export function imprimirRecibo(reciboHtml: string) {
  const impressora = getImpressoraPadrao()

  if (!impressora) {
    window.print()
    return
  }

  const larguraPx = Math.round((impressora.larguraMm / 25.4) * 72)
  const isCupom = impressora.tipo === 'cupom'

  const conteudo = `
    <html>
    <head>
      <title>Recibo - MeuPDV</title>
      <style>
        @page {
          size: ${impressora.larguraMm}mm auto;
          margin: ${impressora.margemMm}mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: ${impressora.fonteSizePx}px;
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

  const copias = impressora.copias || 1
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
