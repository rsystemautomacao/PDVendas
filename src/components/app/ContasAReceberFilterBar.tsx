import { useState } from 'react'
import { X, Search, Printer, LayoutGrid, List, Calendar, Check, ScanLine } from 'lucide-react'

type StatusFiltro = 'recebidas' | 'a-receber' | 'atrasadas'

interface ContasAReceberFilterBarProps {
  onLimpar: () => void
  onBuscar: () => void
  onImprimir: () => void
  onExibirTodasAberto: () => void
  onQuitarMultiplas: () => void
}

export function ContasAReceberFilterBar({
  onLimpar,
  onBuscar,
  onImprimir,
  onExibirTodasAberto,
  onQuitarMultiplas,
}: ContasAReceberFilterBarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [clienteTipo, setClienteTipo] = useState<'nome' | 'celular' | 'email' | 'cpf'>('nome')
  const [clienteValor, setClienteValor] = useState('')
  const [nomeConta, setNomeConta] = useState('')
  const [codigoCarne, setCodigoCarne] = useState('')
  const [dataDe, setDataDe] = useState('2026-02-01')
  const [dataAte, setDataAte] = useState('2026-02-28')
  const [status, setStatus] = useState('active')
  const [agruparPorContas, setAgruparPorContas] = useState(false)
  const [imprimirPorContas, setImprimirPorContas] = useState(false)
  const [statusBotao, setStatusBotao] = useState<StatusFiltro | null>(null)

  const handleLimpar = () => {
    setClienteValor('')
    setNomeConta('')
    setCodigoCarne('')
    setDataDe('2026-02-01')
    setDataAte('2026-02-28')
    setAgruparPorContas(false)
    setImprimirPorContas(false)
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
        <span className="font-semibold">Filtros e ações</span>
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          <List className="h-4 w-4" />
          <select className="rounded border-0 bg-white/20 text-sm text-white">
            <option>20 por página</option>
          </select>
          <select className="rounded border-0 bg-white/20 text-sm text-white">
            <option>Data de vencimento</option>
          </select>
        </div>
      </button>
      {!collapsed && (
        <div className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium text-text-primary">Busque por um cliente</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {(['nome', 'celular', 'email', 'cpf'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="clienteTipo" checked={clienteTipo === t} onChange={() => setClienteTipo(t)} className="text-primary" />
                    <span className="text-sm">{t === 'cpf' ? 'CPF / CNPJ' : t.charAt(0).toUpperCase() + t.slice(1)}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                value={clienteValor}
                onChange={(e) => setClienteValor(e.target.value)}
                placeholder={clienteTipo === 'nome' ? 'Nome' : clienteTipo === 'email' ? 'E-mail' : clienteTipo === 'cpf' ? 'CPF/CNPJ' : 'Celular'}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm"
              />
              <p className="mt-1 text-xs text-red-600">Digite pelo menos 3 caracteres.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Nome da conta</label>
              <input type="text" value={nomeConta} onChange={(e) => setNomeConta(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Código do carnê de recebimento</label>
              <div className="flex gap-2">
                <input type="text" value={codigoCarne} onChange={(e) => setCodigoCarne(e.target.value)} className="flex-1 rounded-lg border border-gray-300 py-2 px-3 text-sm" />
                <button type="button" className="rounded-lg bg-primary p-2 text-white" aria-label="Escanear"><ScanLine className="h-5 w-5" /></button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Data de vencimento da parcela</label>
              <div className="flex gap-2">
                <input type="date" value={dataDe} onChange={(e) => setDataDe(e.target.value)} className="rounded-lg border border-gray-300 py-2 px-3 text-sm" />
                <input type="date" value={dataAte} onChange={(e) => setDataAte(e.target.value)} className="rounded-lg border border-gray-300 py-2 px-3 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-gray-300 py-2 px-3 text-sm">
                <option value="active">Somente ATIVAS</option>
                <option value="all">Todas</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={agruparPorContas} onChange={(e) => setAgruparPorContas(e.target.checked)} className="rounded border-gray-300 text-primary" />
              <span className="text-sm text-text-primary">Agrupar por contas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={imprimirPorContas} onChange={(e) => setImprimirPorContas(e.target.checked)} className="rounded border-gray-300 text-primary" />
              <span className="text-sm text-text-primary">Imprimir por contas e parcelas</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setStatusBotao(statusBotao === 'recebidas' ? null : 'recebidas')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${statusBotao === 'recebidas' ? 'bg-primary text-white' : 'bg-green-100 text-green-800'}`}><Check className="h-4 w-4" /> RECEBIDAS</button>
            <button type="button" onClick={() => setStatusBotao(statusBotao === 'a-receber' ? null : 'a-receber')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${statusBotao === 'a-receber' ? 'bg-primary text-white' : 'bg-primary-pale text-primary'}`}><Check className="h-4 w-4" /> A RECEBER</button>
            <button type="button" onClick={() => setStatusBotao(statusBotao === 'atrasadas' ? null : 'atrasadas')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${statusBotao === 'atrasadas' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}><Check className="h-4 w-4" /> ATRASADAS</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"><Calendar className="h-4 w-4" /> HOJE</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"><Calendar className="h-4 w-4" /> ESTA SEMANA</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"><Calendar className="h-4 w-4" /> ESTE MÊS</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onQuitarMultiplas} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">QUITAR MÚLTIPLAS PARCELAS</button>
            <button type="button" onClick={onExibirTodasAberto} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"><Search className="h-4 w-4" /> EXIBIR TODAS AS PARCELAS EM ABERTO</button>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button type="button" onClick={handleLimpar} className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary-pale px-4 py-2 text-sm font-medium text-primary"><X className="h-4 w-4" /> LIMPAR BUSCA</button>
            <button type="button" onClick={onImprimir} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white"><Printer className="h-4 w-4" /> IMPRIMIR</button>
            <button type="button" onClick={onBuscar} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"><Search className="h-4 w-4" /> BUSCAR</button>
          </div>
        </div>
      )}
    </div>
  )
}
