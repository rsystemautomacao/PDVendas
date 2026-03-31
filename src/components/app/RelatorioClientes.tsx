import { useState, useCallback } from 'react'
import { Printer } from 'lucide-react'
import { ReportFilterBar } from './ReportFilterBar'
import type { RelatorioTipoConfig } from '../../data/relatoriosClientes'
import { MOCK_CLIENTES } from '../../data/mockClientes'

interface RelatorioClientesProps {
  config: RelatorioTipoConfig
}

/** Dados mock para listagem de clientes */
const MOCK_ROWS = MOCK_CLIENTES.map((c) => ({
  id: c.id,
  nome: c.nome,
  telefone: '(11) 99999-0000',
  celular: '(11) 98888-1111',
  email: c.email,
  cpf: '000.000.000-00',
  dataCadastro: '01/02/2026',
  endereco: 'Rua Exemplo, 123 - Centro',
}))

/** Dados mock para relatórios de vendas */
const MOCK_VENDAS = [
  { id: '1', data: '05/02/2026', cliente: 'Maria Silva', valor: 'R$ 450,00', tipo: 'Venda' },
  { id: '2', data: '04/02/2026', cliente: 'João Santos', valor: 'R$ 320,00', tipo: 'Orçamento' },
]

export function RelatorioClientes({ config }: RelatorioClientesProps) {
  const [nomeCliente, setNomeCliente] = useState('')
  const [dataDe, setDataDe] = useState('')
  const [dataAte, setDataAte] = useState('')
  const [exibirEndereco, setExibirEndereco] = useState(config.exibirEndereco)
  const [exibirDataCadastro, setExibirDataCadastro] = useState(config.exibirDataCadastro)
  const [registros] = useState(config.isVendas ? MOCK_VENDAS : MOCK_ROWS)

  const handleLimpar = useCallback(() => {
    setNomeCliente('')
    setDataDe('')
    setDataAte('')
    setExibirEndereco(config.exibirEndereco)
    setExibirDataCadastro(config.exibirDataCadastro)
  }, [config.exibirEndereco, config.exibirDataCadastro])

  const handleBuscar = useCallback(() => {
    // TODO: implementar busca de relatório de clientes
  }, [config.slug, nomeCliente, dataDe, dataAte, exibirEndereco, exibirDataCadastro])

  const handlePeriodo = useCallback((key: string) => {
    const today = new Date()
    let de = new Date(today)
    let ate = new Date(today)
    switch (key) {
      case 'hoje':
        break
      case 'esta-semana':
        de.setDate(today.getDate() - today.getDay())
        break
      case 'este-mes':
        de.setDate(1)
        break
      case 'mes-anterior':
        de.setMonth(today.getMonth() - 1)
        de.setDate(1)
        ate.setDate(0)
        break
      case '90-dias':
        de.setDate(today.getDate() - 90)
        break
      default:
        return
    }
    setDataDe(de.toISOString().slice(0, 10))
    setDataAte(ate.toISOString().slice(0, 10))
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

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
        onBuscar={handleBuscar}
        onPeriodo={config.temAtalhosPeriodo ? handlePeriodo : undefined}
      />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden print:border print:shadow-none">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-text-primary">
            {config.isVendas ? config.titulo : 'Listagem de clientes'}
          </h2>
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
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                      0 Registros
                    </td>
                  </tr>
                ) : (
                  (registros as typeof MOCK_VENDAS).map((r) => (
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
                  {exibirDataCadastro && (
                    <th className="px-4 py-3 font-semibold">Data de Cadastro</th>
                  )}
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Telefone / Celular</th>
                  <th className="px-4 py-3 font-semibold">E-mail / CPF</th>
                  {exibirEndereco && (
                    <th className="px-4 py-3 font-semibold">Endereço</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {registros.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        2 +
                        (exibirDataCadastro ? 1 : 0) +
                        (exibirEndereco ? 1 : 0)
                      }
                      className="px-4 py-8 text-center text-text-secondary"
                    >
                      0 Registros
                    </td>
                  </tr>
                ) : (
                  (registros as typeof MOCK_ROWS).map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      {exibirDataCadastro && (
                        <td className="px-4 py-3">{r.dataCadastro}</td>
                      )}
                      <td className="px-4 py-3">{r.nome}</td>
                      <td className="px-4 py-3">{r.telefone} / {r.celular}</td>
                      <td className="px-4 py-3">{r.email} / {r.cpf}</td>
                      {exibirEndereco && (
                        <td className="px-4 py-3">{r.endereco}</td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-4 py-3 print:hidden">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-primary hover:bg-gray-50"
            >
              Página 1 de 1
            </button>
            <span className="text-sm text-text-secondary">{registros.length} Registros</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-20 z-10 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white shadow-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Printer className="h-5 w-5" />
          IMPRIMIR
        </button>
      </div>
    </div>
  )
}
