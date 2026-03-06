import { useState } from 'react'
import { X, Search, Printer, LayoutGrid, List, Calendar, Check } from 'lucide-react'

type StatusFiltro = 'todas' | 'pagas' | 'a-pagar' | 'atrasadas'

interface ContasAPagarFilterBarProps {
  onLimpar: () => void
  onBuscar: () => void
  onImprimir: () => void
  onExibirTodasAberto: () => void
}

export function ContasAPagarFilterBar({
  onLimpar,
  onBuscar,
  onImprimir,
  onExibirTodasAberto,
}: ContasAPagarFilterBarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [nomeConta, setNomeConta] = useState('')
  const [tipoDespesa, setTipoDespesa] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [notaFiscal, setNotaFiscal] = useState('')
  const [status, setStatus] = useState('active')
  const [tipoData, setTipoData] = useState('vencimento')
  const [dataDe, setDataDe] = useState('2026-02-01')
  const [dataAte, setDataAte] = useState('2026-02-28')
  const [agruparPorContas, setAgruparPorContas] = useState(false)
  const [statusBotao, setStatusBotao] = useState<StatusFiltro | null>(null)

  const handleLimpar = () => {
    setNomeConta('')
    setTipoDespesa('')
    setFornecedor('')
    setNotaFiscal('')
    setStatus('active')
    setDataDe('2026-02-01')
    setDataAte('2026-02-28')
    setAgruparPorContas(false)
    setStatusBotao(null)
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
          <select
            className="rounded border-0 bg-white/20 text-sm text-white focus:ring-2 focus:ring-white"
            value="20"
          >
            <option value="20">20 por página</option>
            <option value="50">50 por página</option>
          </select>
          <select
            className="rounded border-0 bg-white/20 text-sm text-white focus:ring-2 focus:ring-white"
            value="vencimento"
          >
            <option value="vencimento">Data de vencimento</option>
          </select>
        </div>
      </button>
      {!collapsed && (
        <div className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Nome da conta ou número da compra</label>
              <input
                type="text"
                value={nomeConta}
                onChange={(e) => setNomeConta(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm"
                placeholder="Buscar..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Tipo de despesa</label>
              <select
                value={tipoDespesa}
                onChange={(e) => setTipoDespesa(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm"
              >
                <option value="">Todos os tipos</option>
                <option value="fixa">Fixa</option>
                <option value="variavel">Variável</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Selecione um fornecedor</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm"
                  placeholder="Digite pelo menos 3 caracteres"
                />
              </div>
              <p className="mt-1 text-xs text-red-600">Digite pelo menos 3 caracteres</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Nota fiscal</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={notaFiscal}
                  onChange={(e) => setNotaFiscal(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 px-3 text-sm"
              >
                <option value="active">Somente ATIVAS</option>
                <option value="all">Todas</option>
                <option value="inactive">Inativas</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Tipo de data</label>
              <select
                value={tipoData}
                onChange={(e) => setTipoData(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 px-3 text-sm"
              >
                <option value="vencimento">Data de vencimento da parcela</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Data de</label>
              <input
                type="date"
                value={dataDe}
                onChange={(e) => setDataDe(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Data até</label>
              <input
                type="date"
                value={dataAte}
                onChange={(e) => setDataAte(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 px-3 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agruparPorContas}
                onChange={(e) => setAgruparPorContas(e.target.checked)}
                className="rounded border-gray-300 text-primary"
              />
              <span className="text-sm text-text-primary">Agrupar por contas</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusBotao(statusBotao === 'pagas' ? null : 'pagas')}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${statusBotao === 'pagas' ? 'bg-primary text-white' : 'bg-green-100 text-green-800'}`}
            >
              <Check className="h-4 w-4" /> PAGAS
            </button>
            <button
              type="button"
              onClick={() => setStatusBotao(statusBotao === 'a-pagar' ? null : 'a-pagar')}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${statusBotao === 'a-pagar' ? 'bg-primary text-white' : 'bg-primary-pale text-primary'}`}
            >
              <Check className="h-4 w-4" /> A PAGAR
            </button>
            <button
              type="button"
              onClick={() => setStatusBotao(statusBotao === 'atrasadas' ? null : 'atrasadas')}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${statusBotao === 'atrasadas' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}
            >
              <Check className="h-4 w-4" /> ATRASADAS
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
            >
              <Calendar className="h-4 w-4" /> HOJE
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
            >
              <Calendar className="h-4 w-4" /> ESTA SEMANA
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
            >
              <Calendar className="h-4 w-4" /> ESTE MÊS
            </button>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={handleLimpar}
              className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary-pale px-4 py-2 text-sm font-medium text-primary"
            >
              <X className="h-4 w-4" /> LIMPAR BUSCA
            </button>
            <button
              type="button"
              onClick={onImprimir}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              <Printer className="h-4 w-4" /> IMPRIMIR
            </button>
            <button
              type="button"
              onClick={onBuscar}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              <Search className="h-4 w-4" /> BUSCAR
            </button>
            <button
              type="button"
              onClick={onExibirTodasAberto}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white sm:w-auto"
            >
              <Search className="h-4 w-4" /> EXIBIR TODAS AS CONTAS EM ABERTO
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
