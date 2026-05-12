import { useState, useCallback, useEffect } from 'react'
import { Printer, Loader2 } from 'lucide-react'
import { ReportFilterBar } from './ReportFilterBar'
import type { RelatorioTipoConfig } from '../../data/relatoriosClientes'
import { api } from '../../services/api'
import { formatCurrency } from '../../utils/helpers'
import type { Cliente, Venda } from '../../types'

interface ClienteRow {
  id: string
  nome: string
  telefone: string
  celular: string
  email: string
  cpf: string
  dataCadastro: string
  endereco: string
}

interface VendaRow {
  id: string
  data: string
  cliente: string
  valor: string
  tipo: string
}

interface RelatorioClientesProps {
  config: RelatorioTipoConfig
}

export function RelatorioClientes({ config }: RelatorioClientesProps) {
  const [nomeCliente, setNomeCliente] = useState('')
  const [dataDe, setDataDe] = useState('')
  const [dataAte, setDataAte] = useState('')
  const [exibirEndereco, setExibirEndereco] = useState(config.exibirEndereco)
  const [exibirDataCadastro, setExibirDataCadastro] = useState(config.exibirDataCadastro)
  const [registros, setRegistros] = useState<ClienteRow[] | VendaRow[]>([])
  const [loading, setLoading] = useState(false)

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      if (config.isVendas) {
        const params = new URLSearchParams({ limit: '200' })
        if (dataDe) params.set('de', dataDe)
        if (dataAte) params.set('ate', dataAte)
        const res = await api.get(`/vendas?${params}`)
        if (res.success && res.data) {
          const rows: VendaRow[] = (res.data as Venda[])
            .filter(v => !nomeCliente || v.clienteNome?.toLowerCase().includes(nomeCliente.toLowerCase()))
            .map(v => ({
              id: v._id,
              data: new Date(v.criadoEm).toLocaleDateString('pt-BR'),
              cliente: v.clienteNome || '—',
              valor: formatCurrency(v.total),
              tipo: v.status === 'orcamento' ? 'Orçamento' : 'Venda',
            }))
          setRegistros(rows)
        }
      } else {
        const params = new URLSearchParams({ limit: '200' })
        if (nomeCliente) params.set('busca', nomeCliente)
        const res = await api.get(`/clientes?${params}`)
        if (res.success && res.data) {
          const rows: ClienteRow[] = (res.data as Cliente[]).map(c => ({
            id: c._id,
            nome: c.nome,
            telefone: c.telefone || '—',
            celular: c.celular || '—',
            email: c.email || '—',
            cpf: c.cpfCnpj || '—',
            dataCadastro: new Date(c.criadoEm).toLocaleDateString('pt-BR'),
            endereco: c.endereco
              ? [c.endereco.logradouro, c.endereco.numero, c.endereco.bairro, c.endereco.cidade]
                  .filter(Boolean).join(', ')
              : '—',
          }))
          setRegistros(rows)
        }
      }
    } catch {
      // silencioso — lista fica vazia
    } finally {
      setLoading(false)
    }
  }, [config.isVendas, nomeCliente, dataDe, dataAte])

  // Carrega ao montar e sempre que os filtros mudarem
  useEffect(() => { buscar() }, [buscar])

  const handleLimpar = useCallback(() => {
    setNomeCliente('')
    setDataDe('')
    setDataAte('')
    setExibirEndereco(config.exibirEndereco)
    setExibirDataCadastro(config.exibirDataCadastro)
  }, [config.exibirEndereco, config.exibirDataCadastro])

  const handlePeriodo = useCallback((key: string) => {
    const today = new Date()
    let de = new Date(today)
    let ate = new Date(today)
    switch (key) {
      case 'hoje': break
      case 'esta-semana': de.setDate(today.getDate() - today.getDay()); break
      case 'este-mes': de.setDate(1); break
      case 'mes-anterior':
        de.setMonth(today.getMonth() - 1); de.setDate(1)
        ate.setDate(0); break
      case '90-dias': de.setDate(today.getDate() - 90); break
      default: return
    }
    setDataDe(de.toISOString().slice(0, 10))
    setDataAte(ate.toISOString().slice(0, 10))
  }, [])

  const clienteRows = registros as ClienteRow[]
  const vendaRows   = registros as VendaRow[]

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <ReportFilterBar
          config={config}
          nomeCliente={nomeCliente}
          onNomeClienteChange={setNomeCliente}
          dataDe={dataDe}
          dataAte={dataAte}
          onDataDeChange={setDataDe}
          onDataAteChange={setDataAte}
          exibirEndereco={exibirEndereco}
          onExibirEnderecoChange={setExibirEndereco}
          exibirDataCadastro={exibirDataCadastro}
          onExibirDataCadastroChange={setExibirDataCadastro}
          onLimpar={handleLimpar}
          onBuscar={buscar}
          onPeriodo={config.temAtalhosPeriodo ? handlePeriodo : undefined}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden print:border print:shadow-none">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            {config.isVendas ? config.titulo : 'Listagem de clientes'}
          </h2>
          {loading && <Loader2 size={18} className="animate-spin text-primary" />}
        </div>

        <div className="overflow-x-auto">
          {config.isVendas ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Tipo de venda</th>
                </tr>
              </thead>
              <tbody>
                {vendaRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                      {loading ? 'Carregando...' : 'Nenhum registro encontrado'}
                    </td>
                  </tr>
                ) : (
                  vendaRows.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{r.data}</td>
                      <td className="px-4 py-3">{r.cliente}</td>
                      <td className="px-4 py-3">{r.valor}</td>
                      <td className="px-4 py-3">{r.tipo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-text-secondary">
                <tr>
                  {exibirDataCadastro && <th className="px-4 py-3 font-semibold">Data de Cadastro</th>}
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Telefone / Celular</th>
                  <th className="px-4 py-3 font-semibold">E-mail / CPF</th>
                  {exibirEndereco && <th className="px-4 py-3 font-semibold">Endereço</th>}
                </tr>
              </thead>
              <tbody>
                {clienteRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2 + (exibirDataCadastro ? 1 : 0) + (exibirEndereco ? 1 : 0)}
                      className="px-4 py-8 text-center text-text-secondary"
                    >
                      {loading ? 'Carregando...' : 'Nenhum registro encontrado'}
                    </td>
                  </tr>
                ) : (
                  clienteRows.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      {exibirDataCadastro && <td className="px-4 py-3">{r.dataCadastro}</td>}
                      <td className="px-4 py-3">{r.nome}</td>
                      <td className="px-4 py-3">{r.telefone} / {r.celular}</td>
                      <td className="px-4 py-3">{r.email} / {r.cpf}</td>
                      {exibirEndereco && <td className="px-4 py-3">{r.endereco}</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-gray-200 px-4 py-3 print:hidden">
          <span className="text-sm text-text-secondary">{registros.length} registro{registros.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="fixed bottom-6 right-20 z-10 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white shadow-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Printer className="h-5 w-5" />
          IMPRIMIR
        </button>
      </div>
    </div>
  )
}
