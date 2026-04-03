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

export function imprimirRecibo(reciboHtml: string) {
  const impressora = getImpressoraPadrao()

  if (!impressora) {
    // Sem impressora configurada, usa window.print() padrão
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

  const win = window.open('', '_blank', `width=${Math.max(larguraPx + 40, 320)},height=600`)
  if (!win) {
    // Popup bloqueado, fallback para window.print()
    window.print()
    return
  }

  win.document.write(conteudo)
  win.document.close()
  win.focus()

  const copias = impressora.copias || 1
  let impressas = 0

  const printNext = () => {
    impressas++
    win.print()
    if (impressas < copias) {
      setTimeout(printNext, 1000)
    } else {
      setTimeout(() => win.close(), 500)
    }
  }

  setTimeout(printNext, 400)
}

export function deveImprimirAutomatico(): boolean {
  const impressora = getImpressoraPadrao()
  return !!impressora?.imprimirAutomatico
}
