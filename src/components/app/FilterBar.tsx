import { useState } from 'react'
import { Search, X, LayoutGrid, List, BarChart3 } from 'lucide-react'

interface FilterBarProps {
  searchPlaceholder?: string
  statusOptions?: Array<{ value: string; label: string }>
  onSearch?: (value: string) => void
  onStatusChange?: (value: string) => void
  onClear?: () => void
  onSearchSubmit?: () => void
  onReports?: () => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  perPage?: number
  onPerPageChange?: (n: number) => void
  sortLabel?: string
  onSortChange?: (value: string) => void
}

export function FilterBar({
  searchPlaceholder = 'Nome / CPF / CNPJ / Celular / E-mail / Código',
  statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Somente ATIVOS' },
    { value: 'inactive', label: 'Inativos' },
  ],
  onSearch,
  onStatusChange,
  onClear,
  onSearchSubmit,
  onReports,
  viewMode = 'list',
  onViewModeChange,
  perPage = 20,
  onPerPageChange,
  sortLabel = 'Alfabética',
  onSortChange,
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState('')
  const [status, setStatus] = useState(statusOptions[1]?.value ?? 'active')

  const handleClear = () => {
    setSearchValue('')
    onClear?.()
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-primary/10 px-4 py-2">
        <span className="text-sm font-semibold text-text-primary">Filtros</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewModeChange?.('grid')}
            className={`rounded p-1.5 ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-200'}`}
            aria-label="Visualização em grade"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange?.('list')}
            className={`rounded p-1.5 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-200'}`}
            aria-label="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </button>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange?.(Number(e.target.value))}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-text-primary"
            aria-label="Itens por página"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
          <select
            value={sortLabel}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-text-primary"
            aria-label="Ordenação"
          >
            <option value="Alfabética">Alfabética</option>
            <option value="Data">Data</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                onSearch?.(e.target.value)
              }}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              aria-label="Buscar"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-status" className="text-sm font-medium text-text-primary">
              Status
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                onStatusChange?.(e.target.value)
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-text-primary"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReports}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-400 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
          >
            <BarChart3 className="h-4 w-4" />
            RELATÓRIOS
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary-pale px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
          >
            <X className="h-4 w-4" />
            LIMPAR BUSCA
          </button>
          <button
            type="button"
            onClick={() => onSearchSubmit?.()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            <Search className="h-4 w-4" />
            BUSCAR
          </button>
        </div>
      </div>
    </div>
  )
}
