import { useState } from 'react'
import { X, Search, Printer, LayoutGrid, List } from 'lucide-react'

interface DespesasFilterBarProps {
  onLimpar: () => void
  onBuscar: () => void
  onImprimir: () => void
}

export function DespesasFilterBar({ onLimpar, onBuscar, onImprimir }: DespesasFilterBarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [nome, setNome] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [tipoDespesa, setTipoDespesa] = useState('')
  const [dataDe, setDataDe] = useState('2026-02-01')
  const [dataAte, setDataAte] = useState('2026-02-28')
  const [status, setStatus] = useState('active')

  const handleLimpar = () => {
    setNome('')
    setFornecedor('')
    setTipoDespesa('')
    setDataDe('2026-02-01')
    setDataAte('2026-02-28')
    setStatus('active')
    onLimpar()
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between bg-primary px-4 py-3 text-left text-white"
        aria-expanded={!collapsed}
      >
        <span className="font-semibold">Filtros</span>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded p-1 hover:bg-white/10" aria-label="Grade">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 hover:bg-white/10" aria-label="Lista">
            <List className="h-4 w-4" />
          </button>
          <span className="text-sm opacity-90">{collapsed ? 'Expandir' : 'Recolher'}</span>
        </div>
      </button>
      {!collapsed && (
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da despesa"
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Fornecedor</label>
            <input
              type="text"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              placeholder="Nome do fornecedor"
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Tipo de despesa</label>
            <select
              value={tipoDespesa}
              onChange={(e) => setTipoDespesa(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm"
            >
              <option value="">Todos</option>
              <option value="fixa">Fixa</option>
              <option value="variavel">Variável</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Data de</label>
            <input
              type="date"
              value={dataDe}
              onChange={(e) => setDataDe(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Data até</label>
            <input
              type="date"
              value={dataAte}
              onChange={(e) => setDataAte(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm"
            >
              <option value="active">Todas</option>
              <option value="pago">Pago</option>
              <option value="aberto">Em aberto</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={handleLimpar}
              className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary-pale px-4 py-2 text-sm font-medium text-primary"
            >
              <X className="h-4 w-4" /> LIMPAR
            </button>
            <button
              type="button"
              onClick={onImprimir}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-text-primary hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" /> IMPRIMIR
            </button>
            <button
              type="button"
              onClick={onBuscar}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              <Search className="h-4 w-4" /> BUSCAR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
