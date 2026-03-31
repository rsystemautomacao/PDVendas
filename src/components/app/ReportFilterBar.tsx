import { useState } from 'react'
import { X, Search, Calendar } from 'lucide-react'
import type { RelatorioTipoConfig } from '../../data/relatoriosClientes'

const PERIODOS = [
  { key: 'hoje', label: 'HOJE' },
  { key: 'esta-semana', label: 'ESTA SEMANA' },
  { key: 'este-mes', label: 'ESTE MÊS' },
  { key: 'mes-anterior', label: 'MÊS ANTERIOR' },
  { key: '90-dias', label: '90 DIAS' },
] as const

interface ReportFilterBarProps {
  config: RelatorioTipoConfig
  nomeCliente: string
  onNomeClienteChange: (v: string) => void
  dataDe: string
  dataAte: string
  onDataDeChange: (v: string) => void
  onDataAteChange: (v: string) => void
  exibirEndereco: boolean
  onExibirEnderecoChange: (v: boolean) => void
  exibirDataCadastro: boolean
  onExibirDataCadastroChange: (v: boolean) => void
  onLimpar: () => void
  onBuscar: () => void
  onPeriodo?: (key: string) => void
}

export function ReportFilterBar({
  config,
  nomeCliente,
  onNomeClienteChange,
  dataDe,
  dataAte,
  onDataDeChange,
  onDataAteChange,
  exibirEndereco,
  onExibirEnderecoChange,
  exibirDataCadastro,
  onExibirDataCadastroChange,
  onLimpar,
  onBuscar,
  onPeriodo,
}: ReportFilterBarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between bg-primary/10 px-4 py-3 text-left md:rounded-none"
        aria-expanded={!collapsed}
      >
        <span className="font-semibold text-text-primary">Filtros</span>
        <div className="flex items-center gap-2">
          {config.temAtalhosPeriodo && (
            <select
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-text-primary"
              aria-label="Ordenação"
              onClick={(e) => e.stopPropagation()}
            >
              <option>Alfabética</option>
            </select>
          )}
          <span className="text-text-muted" aria-hidden>
            {collapsed ? '▼' : '▲'}
          </span>
        </div>
      </button>
      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="filtro-nome-cliente" className="mb-1 block text-sm font-medium text-text-primary">
                Nome do Cliente
              </label>
              <input
                id="filtro-nome-cliente"
                type="text"
                value={nomeCliente}
                onChange={(e) => onNomeClienteChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Nome do cliente"
              />
            </div>
            {config.temFiltroData && (
              <>
                <div>
                  <label htmlFor="filtro-data-de" className="mb-1 block text-sm font-medium text-text-primary">
                    Data de
                  </label>
                  <input
                    id="filtro-data-de"
                    type="date"
                    value={dataDe}
                    onChange={(e) => onDataDeChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="filtro-data-ate" className="mb-1 block text-sm font-medium text-text-primary">
                    Data até
                  </label>
                  <input
                    id="filtro-data-ate"
                    type="date"
                    value={dataAte}
                    onChange={(e) => onDataAteChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </>
            )}
          </div>

          {!config.isVendas && (
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exibirEndereco}
                  onChange={(e) => onExibirEnderecoChange(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-primary">Exibir endereço dos clientes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exibirDataCadastro}
                  onChange={(e) => onExibirDataCadastroChange(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-primary">Exibir data de cadastro dos clientes</span>
              </label>
            </div>
          )}

          {config.temAtalhosPeriodo && onPeriodo && (
            <div className="flex flex-wrap gap-2">
              {PERIODOS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onPeriodo(p.key)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <Calendar className="h-4 w-4" />
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={onLimpar}
              className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary-pale px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              <X className="h-4 w-4" />
              LIMPAR BUSCA
            </button>
            <button
              type="button"
              onClick={onBuscar}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <Search className="h-4 w-4" />
              BUSCAR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
