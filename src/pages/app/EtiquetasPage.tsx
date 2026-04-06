import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Search, Printer, Plus, Minus, Tag, Trash2 } from 'lucide-react'
import { useProdutos } from '../../contexts/ProdutoContext'
import { formatCurrency } from '../../utils/helpers'
import JsBarcode from 'jsbarcode'

interface EtiquetaItem {
  produtoId: string
  nome: string
  codigo: string
  preco: number
  quantidade: number
}

function BarcodeLabel({ item }: { item: EtiquetaItem }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current && item.codigo) {
      try {
        JsBarcode(svgRef.current, item.codigo, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 10,
          margin: 2,
        })
      } catch {
        // Invalid barcode, show text only
      }
    }
  }, [item.codigo])

  return (
    <div className="etiqueta-item border border-dashed border-gray-300 p-3 flex flex-col items-center justify-center text-center" style={{ width: '200px', height: '120px', pageBreakInside: 'avoid' }}>
      <p className="text-[10px] font-bold text-gray-800 leading-tight line-clamp-2 mb-1" style={{ maxWidth: '180px' }}>{item.nome}</p>
      <svg ref={svgRef} className="max-w-[180px]" />
      <p className="text-sm font-black text-gray-900 mt-1">{formatCurrency(item.preco)}</p>
    </div>
  )
}

export function EtiquetasPage() {
  const { produtos } = useProdutos()
  const [busca, setBusca] = useState('')
  const [itens, setItens] = useState<EtiquetaItem[]>([])
  const [showBusca, setShowBusca] = useState(false)

  const resultados = useMemo(() => {
    if (!busca.trim()) return []
    const q = busca.toLowerCase()
    return produtos
      .filter(p => p.ativo && (p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)))
      .slice(0, 10)
  }, [produtos, busca])

  const addItem = useCallback((p: { _id: string; nome: string; codigo: string; preco: number }) => {
    setItens(prev => {
      const existing = prev.find(i => i.produtoId === p._id)
      if (existing) {
        return prev.map(i => i.produtoId === p._id ? { ...i, quantidade: i.quantidade + 1 } : i)
      }
      return [...prev, { produtoId: p._id, nome: p.nome, codigo: p.codigo, preco: p.preco, quantidade: 1 }]
    })
    setBusca('')
    setShowBusca(false)
  }, [])

  const updateQty = (produtoId: string, delta: number) => {
    setItens(prev => prev.map(i => {
      if (i.produtoId !== produtoId) return i
      const newQty = Math.max(1, i.quantidade + delta)
      return { ...i, quantidade: newQty }
    }))
  }

  const removeItem = (produtoId: string) => {
    setItens(prev => prev.filter(i => i.produtoId !== produtoId))
  }

  const totalEtiquetas = itens.reduce((s, i) => s + i.quantidade, 0)

  // Expand items into individual labels for printing
  const etiquetasExpandidas = useMemo(() => {
    const result: EtiquetaItem[] = []
    for (const item of itens) {
      for (let i = 0; i < item.quantidade; i++) {
        result.push(item)
      }
    }
    return result
  }, [itens])

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-5xl space-y-4 print:hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Tag size={22} className="text-primary" /> Etiquetas de Preco
            </h1>
            <p className="text-sm text-gray-500 mt-1">{totalEtiquetas} etiqueta(s) para imprimir</p>
          </div>
          <button
            onClick={handleImprimir}
            disabled={itens.length === 0}
            className="btn-primary disabled:opacity-50"
          >
            <Printer size={18} /> Imprimir
          </button>
        </div>

        {/* Search products */}
        <div className="card p-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Adicionar produto</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text" placeholder="Buscar produto por nome ou codigo..."
              value={busca} onChange={e => { setBusca(e.target.value); setShowBusca(true) }}
              onFocus={() => setShowBusca(true)}
              onBlur={() => setTimeout(() => setShowBusca(false), 200)}
              className="input-field pl-9"
            />
            {showBusca && resultados.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {resultados.map(p => (
                  <button key={p._id} onClick={() => addItem(p)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b last:border-0 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-700">{p.nome}</p>
                      <p className="text-xs text-gray-400">Cod: {p.codigo}</p>
                    </div>
                    <span className="text-primary font-bold">{formatCurrency(p.preco)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Items list */}
        {itens.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16">
            <Tag size={48} className="text-gray-200 mb-3" />
            <p className="text-gray-400">Adicione produtos para gerar etiquetas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {itens.map(item => (
              <div key={item.produtoId} className="card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{item.nome}</p>
                  <p className="text-xs text-gray-400">Cod: {item.codigo} | {formatCurrency(item.preco)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.produtoId, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-gray-50">
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-gray-700">{item.quantidade}</span>
                  <button onClick={() => updateQty(item.produtoId, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-gray-50">
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={() => removeItem(item.produtoId)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Preview */}
        {etiquetasExpandidas.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Pre-visualizacao</h2>
            <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-2 justify-center">
              {etiquetasExpandidas.slice(0, 12).map((item, idx) => (
                <BarcodeLabel key={`${item.produtoId}-${idx}`} item={item} />
              ))}
              {etiquetasExpandidas.length > 12 && (
                <p className="text-sm text-gray-400 w-full text-center mt-2">...e mais {etiquetasExpandidas.length - 12} etiqueta(s)</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Print area - only visible when printing */}
      <div className="hidden print:block">
        <div className="flex flex-wrap gap-0" style={{ margin: 0 }}>
          {etiquetasExpandidas.map((item, idx) => (
            <BarcodeLabel key={`print-${item.produtoId}-${idx}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
