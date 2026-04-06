import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useVendas } from '../../contexts/VendaContext'
import { useFinanceiro } from '../../contexts/FinanceiroContext'
import { formatCurrency, formatDate } from '../../utils/helpers'

export function FluxoDeCaixaPage() {
  const { vendas, carregarSeNecessario: carregarVendas } = useVendas()
  useEffect(() => { carregarVendas() }, [carregarVendas])
  const { contasPagar, contasReceber, despesas } = useFinanceiro()

  const hoje = new Date().toISOString().substring(0, 10)
  const mesInicio = hoje.substring(0, 7) + '-01'
  const mesFim = hoje.substring(0, 7) + '-31'

  const [dataDe, setDataDe] = useState(mesInicio)
  const [dataAte, setDataAte] = useState(mesFim)

  const quickFilter = (type: 'hoje' | 'semana' | 'mes' | 'mesAnterior') => {
    const now = new Date()
    switch (type) {
      case 'hoje':
        setDataDe(hoje); setDataAte(hoje); break
      case 'semana': {
        const day = now.getDay()
        const start = new Date(now); start.setDate(now.getDate() - day)
        const end = new Date(start); end.setDate(start.getDate() + 6)
        setDataDe(start.toISOString().substring(0, 10))
        setDataAte(end.toISOString().substring(0, 10))
        break
      }
      case 'mes':
        setDataDe(mesInicio); setDataAte(mesFim); break
      case 'mesAnterior': {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        setDataDe(prev.toISOString().substring(0, 10))
        setDataAte(prevEnd.toISOString().substring(0, 10))
        break
      }
    }
  }

  const inRange = (date: string) => date >= dataDe && date <= dataAte

  const fluxo = useMemo(() => {
    // Entradas
    const vendasPeriodo = vendas.filter(v => v.status === 'finalizada' && inRange(v.criadoEm.substring(0, 10)))
    const totalVendas = vendasPeriodo.reduce((s, v) => s + v.total, 0)

    const recebidos = contasReceber.filter(c => c.recebido && c.recebidoEm && inRange(c.recebidoEm))
    const totalRecebido = recebidos.reduce((s, c) => s + c.valorRecebido, 0)

    const totalEntradas = totalVendas + totalRecebido

    // Saidas
    const contasPagas = contasPagar.filter(c => c.pago && c.pagoEm && inRange(c.pagoEm))
    const totalContasPagas = contasPagas.reduce((s, c) => s + c.valorPago, 0)

    const despesasPagas = despesas.filter(d => d.pago && d.pagoEm && inRange(d.pagoEm))
    const totalDespesas = despesasPagas.reduce((s, d) => s + d.valor, 0)

    const totalSaidas = totalContasPagas + totalDespesas

    // Consolidar movimentacoes
    const movs: { data: string; descricao: string; tipo: 'entrada' | 'saida'; valor: number }[] = []

    vendasPeriodo.forEach(v => movs.push({
      data: v.criadoEm.substring(0, 10),
      descricao: `Venda #${v.numero} - ${v.clienteNome || 'Consumidor Final'}`,
      tipo: 'entrada',
      valor: v.total,
    }))

    recebidos.forEach(c => movs.push({
      data: c.recebidoEm!,
      descricao: `Recebimento: ${c.descricao}`,
      tipo: 'entrada',
      valor: c.valorRecebido,
    }))

    contasPagas.forEach(c => movs.push({
      data: c.pagoEm!,
      descricao: `Pagamento: ${c.descricao}`,
      tipo: 'saida',
      valor: c.valorPago,
    }))

    despesasPagas.forEach(d => movs.push({
      data: d.pagoEm!,
      descricao: `Despesa: ${d.nome}`,
      tipo: 'saida',
      valor: d.valor,
    }))

    movs.sort((a, b) => b.data.localeCompare(a.data))

    return { totalVendas, totalRecebido, totalEntradas, totalContasPagas, totalDespesas, totalSaidas, saldo: totalEntradas - totalSaidas, movimentacoes: movs }
  }, [vendas, contasPagar, contasReceber, despesas, dataDe, dataAte])

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-xl font-bold text-gray-800">Fluxo de Caixa</h1>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data de</label>
              <input type="date" value={dataDe} onChange={e => setDataDe(e.target.value)} className="input-field" />
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data ate</label>
              <input type="date" value={dataAte} onChange={e => setDataAte(e.target.value)} className="input-field" />
            </div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => quickFilter('hoje')} className="px-3 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20">Hoje</button>
              <button onClick={() => quickFilter('semana')} className="px-3 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20">Semana</button>
              <button onClick={() => quickFilter('mes')} className="px-3 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20">Este Mes</button>
              <button onClick={() => quickFilter('mesAnterior')} className="px-3 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20">Mes Anterior</button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500">Entradas</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(fluxo.totalEntradas)}</p>
            <div className="mt-2 text-xs text-gray-400 space-y-0.5">
              <p>Vendas: {formatCurrency(fluxo.totalVendas)}</p>
              <p>Recebimentos: {formatCurrency(fluxo.totalRecebido)}</p>
            </div>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500">Saidas</p>
            <p className="text-xl font-bold text-red-500">{formatCurrency(fluxo.totalSaidas)}</p>
            <div className="mt-2 text-xs text-gray-400 space-y-0.5">
              <p>Contas pagas: {formatCurrency(fluxo.totalContasPagas)}</p>
              <p>Despesas: {formatCurrency(fluxo.totalDespesas)}</p>
            </div>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500">Saldo</p>
            <p className={`text-xl font-bold ${fluxo.saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(fluxo.saldo)}
            </p>
          </div>
        </div>

        {/* Movimentacoes */}
        <div className="card">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold text-gray-700">
              Movimentacoes ({fluxo.movimentacoes.length})
            </p>
          </div>
          {fluxo.movimentacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <TrendingUp size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma movimentacao no periodo</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {fluxo.movimentacoes.map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.tipo === 'entrada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {m.tipo === 'entrada' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.descricao}</p>
                    <p className="text-xs text-gray-400">{formatDate(m.data)}</p>
                  </div>
                  <p className={`text-sm font-bold flex-shrink-0 ${
                    m.tipo === 'entrada' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {m.tipo === 'saida' ? '-' : '+'}{formatCurrency(m.valor)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
