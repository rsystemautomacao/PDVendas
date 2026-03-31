import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const PRIMARY = [99, 102, 241] as const   // #6366F1
const DARK = [31, 41, 55] as const        // gray-800
const GRAY = [107, 114, 128] as const     // gray-500
const GREEN = [16, 185, 129] as const     // emerald-500
const RED = [239, 68, 68] as const        // red-500
const AMBER = [245, 158, 11] as const     // amber-500

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function addHeader(doc: jsPDF, empresaNome: string, titulo: string, periodo: string) {
  const pageW = doc.internal.pageSize.getWidth()

  // Purple bar
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageW, 28, 'F')

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(empresaNome || 'MeuPDV', 14, 12)

  // Report title
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(titulo, 14, 20)

  // Period on the right
  doc.setFontSize(9)
  doc.text(periodo, pageW - 14, 12, { align: 'right' })

  // Date/time
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - 14, 20, { align: 'right' })

  doc.setTextColor(...DARK)
  return 36 // y position after header
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PRIMARY)
  doc.text(title, 14, y)
  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.5)
  doc.line(14, y + 2, 80, y + 2)
  doc.setTextColor(...DARK)
  return y + 8
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.getHeight()
    const pageW = doc.internal.pageSize.getWidth()
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text(`Pagina ${i} de ${pageCount}`, pageW / 2, pageH - 8, { align: 'center' })
    doc.text('MeuPDV - Sistema de Gestao', 14, pageH - 8)
  }
}

interface VendasData {
  totalPeriodo: number
  qtd: number
  ticket: number
  canceladas: number
  formas: Record<string, number>
  topProdutos: { nome: string; qtd: number; total: number }[]
  topClientes: { nome: string; qtd: number; total: number }[]
}

interface FinanceiroData {
  totalAReceber: number
  totalAPagar: number
  totalDespPendentes: number
  cpAtrasadas: number
  crAtrasadas: number
  totalAPagarAtrasado: number
  totalAReceberAtrasado: number
  cpProximas: number
}

interface EstoqueData {
  total: number
  ativos: number
  valorTotal: number
  valorCusto: number
  margemMedia: number
  baixoEstoque: { nome: string; estoque: number; estoqueMinimo: number; unidade: string }[]
  semEstoque: { nome: string }[]
}

const formaLabel: Record<string, string> = {
  dinheiro: 'Dinheiro', credito: 'Credito', debito: 'Debito',
  pix: 'PIX', boleto: 'Boleto', crediario: 'Crediario',
}

export function exportVendasPdf(data: VendasData, empresaNome: string, periodo: string) {
  const doc = new jsPDF()
  let y = addHeader(doc, empresaNome, 'Relatorio de Vendas', periodo)

  // KPIs
  y = addSectionTitle(doc, y, 'Resumo do Periodo')
  const kpis = [
    ['Total de Vendas', formatCurrency(data.totalPeriodo)],
    ['Quantidade de Vendas', String(data.qtd)],
    ['Ticket Medio', formatCurrency(data.ticket)],
    ['Vendas Canceladas', String(data.canceladas)],
  ]
  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: kpis,
    theme: 'grid',
    headStyles: { fillColor: [...PRIMARY], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // Payment methods
  if (Object.keys(data.formas).length > 0) {
    y = addSectionTitle(doc, y, 'Formas de Pagamento')
    const formasRows = Object.entries(data.formas)
      .sort(([, a], [, b]) => b - a)
      .map(([forma, valor]) => [
        formaLabel[forma] || forma,
        data.totalPeriodo > 0 ? `${((valor / data.totalPeriodo) * 100).toFixed(1)}%` : '0%',
        formatCurrency(valor),
      ])
    autoTable(doc, {
      startY: y,
      head: [['Forma', 'Participacao', 'Valor']],
      body: formasRows,
      theme: 'grid',
      headStyles: { fillColor: [...PRIMARY], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right', fontStyle: 'bold' } },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // Top Products
  if (data.topProdutos.length > 0) {
    if (y > 230) { doc.addPage(); y = 20 }
    y = addSectionTitle(doc, y, 'Top 10 Produtos Mais Vendidos')
    const prodRows = data.topProdutos.map((p, i) => [
      `${i + 1}º`,
      p.nome,
      `${p.qtd} un`,
      formatCurrency(p.total),
    ])
    autoTable(doc, {
      startY: y,
      head: [['#', 'Produto', 'Qtd', 'Total']],
      body: prodRows,
      theme: 'grid',
      headStyles: { fillColor: [...PRIMARY], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // Top Clients
  if (data.topClientes.length > 0) {
    if (y > 230) { doc.addPage(); y = 20 }
    y = addSectionTitle(doc, y, 'Top 10 Clientes')
    const clientRows = data.topClientes.map((c, i) => [
      `${i + 1}º`,
      c.nome,
      `${c.qtd} venda(s)`,
      formatCurrency(c.total),
    ])
    autoTable(doc, {
      startY: y,
      head: [['#', 'Cliente', 'Vendas', 'Total']],
      body: clientRows,
      theme: 'grid',
      headStyles: { fillColor: [...PRIMARY], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      },
    })
  }

  addFooter(doc)
  doc.save(`relatorio-vendas-${new Date().toISOString().substring(0, 10)}.pdf`)
}

export function exportFinanceiroPdf(data: FinanceiroData, empresaNome: string) {
  const doc = new jsPDF()
  let y = addHeader(doc, empresaNome, 'Relatorio Financeiro', new Date().toLocaleDateString('pt-BR'))

  y = addSectionTitle(doc, y, 'Resumo Financeiro')
  const saldo = data.totalAReceber - data.totalAPagar - data.totalDespPendentes

  const rows = [
    ['Total a Receber', formatCurrency(data.totalAReceber)],
    ['  Atrasadas', data.crAtrasadas > 0 ? `${data.crAtrasadas} conta(s) - ${formatCurrency(data.totalAReceberAtrasado)}` : 'Nenhuma'],
    ['Total a Pagar', formatCurrency(data.totalAPagar)],
    ['  Atrasadas', data.cpAtrasadas > 0 ? `${data.cpAtrasadas} conta(s) - ${formatCurrency(data.totalAPagarAtrasado)}` : 'Nenhuma'],
    ['Despesas Pendentes', formatCurrency(data.totalDespPendentes)],
    ['Vencem em 7 dias', `${data.cpProximas} conta(s)`],
  ]

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [...PRIMARY], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        const text = String(hookData.cell.raw)
        if (text.startsWith('  ')) {
          hookData.cell.styles.fontStyle = 'italic'
          hookData.cell.styles.textColor = [...GRAY]
          hookData.cell.styles.fontSize = 8
        }
      }
    },
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // Balance card
  y = addSectionTitle(doc, y, 'Balanco Geral')
  const balRows = [
    ['(+) A Receber', formatCurrency(data.totalAReceber)],
    ['(-) A Pagar', formatCurrency(data.totalAPagar)],
    ['(-) Despesas Pendentes', formatCurrency(data.totalDespPendentes)],
    ['SALDO PROJETADO', formatCurrency(saldo)],
  ]
  autoTable(doc, {
    startY: y,
    body: balRows,
    theme: 'grid',
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.row.index === 3) {
        hookData.cell.styles.fillColor = saldo >= 0 ? [...GREEN] : [...RED]
        hookData.cell.styles.textColor = [255, 255, 255]
        hookData.cell.styles.fontStyle = 'bold'
        hookData.cell.styles.fontSize = 11
      }
    },
  })

  addFooter(doc)
  doc.save(`relatorio-financeiro-${new Date().toISOString().substring(0, 10)}.pdf`)
}

export function exportEstoquePdf(data: EstoqueData, empresaNome: string, totalClientes: number, clientesAtivos: number) {
  const doc = new jsPDF()
  let y = addHeader(doc, empresaNome, 'Relatorio de Estoque', new Date().toLocaleDateString('pt-BR'))

  y = addSectionTitle(doc, y, 'Visao Geral')
  const kpis = [
    ['Produtos Cadastrados', String(data.total)],
    ['Produtos Ativos', String(data.ativos)],
    ['Valor do Estoque (Venda)', formatCurrency(data.valorTotal)],
    ['Valor do Estoque (Custo)', formatCurrency(data.valorCusto)],
    ['Margem Media', `${data.margemMedia.toFixed(1)}%`],
    ['Produtos Sem Estoque', String(data.semEstoque.length)],
    ['Produtos com Estoque Baixo', String(data.baixoEstoque.length)],
  ]
  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: kpis,
    theme: 'grid',
    headStyles: { fillColor: [...PRIMARY], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // Low stock
  if (data.baixoEstoque.length > 0) {
    if (y > 200) { doc.addPage(); y = 20 }
    y = addSectionTitle(doc, y, `Produtos com Estoque Baixo (${data.baixoEstoque.length})`)
    const stockRows = data.baixoEstoque.map(p => [
      p.nome,
      `${p.estoque} ${p.unidade}`,
      String(p.estoqueMinimo),
      p.estoque === 0 ? 'SEM ESTOQUE' : 'BAIXO',
    ])
    autoTable(doc, {
      startY: y,
      head: [['Produto', 'Estoque', 'Minimo', 'Status']],
      body: stockRows,
      theme: 'grid',
      headStyles: { fillColor: [...AMBER], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          const val = String(hookData.cell.raw)
          if (val === 'SEM ESTOQUE') {
            hookData.cell.styles.textColor = [...RED]
          } else {
            hookData.cell.styles.textColor = [...AMBER]
          }
        }
      },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // Summary
  if (y > 240) { doc.addPage(); y = 20 }
  y = addSectionTitle(doc, y, 'Resumo Geral')
  const sumRows = [
    ['Clientes Cadastrados', String(totalClientes)],
    ['Clientes Ativos', String(clientesAtivos)],
    ['Produtos Sem Estoque', String(data.semEstoque.length)],
    ['Produtos Estoque Baixo', String(data.baixoEstoque.length)],
  ]
  autoTable(doc, {
    startY: y,
    body: sumRows,
    theme: 'grid',
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  })

  addFooter(doc)
  doc.save(`relatorio-estoque-${new Date().toISOString().substring(0, 10)}.pdf`)
}
