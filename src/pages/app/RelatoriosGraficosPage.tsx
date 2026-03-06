import { useState, useMemo } from 'react'
import { ShoppingCart, DollarSign, Box, TrendingUp, TrendingDown } from 'lucide-react'
import { useVendas } from '../../contexts/VendaContext'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useClientes } from '../../contexts/ClienteContext'
import { useFinanceiro } from '../../contexts/FinanceiroContext'
import { formatCurrency } from '../../utils/helpers'

type Aba = 'vendas' | 'financeiro' | 'estoque'

export function RelatoriosGraficosPage() {
  const { vendas } = useVendas()
  const { produtos } = useProdutos()
  const { clientes } = useClientes()
  const { contasPagar, contasReceber, despesas } = useFinanceiro()

  const [aba, setAba] = useState<Aba>('vendas')

  const hoje = new Date().toISOString().substring(0, 10)
  const mesAtual = hoje.substring(0, 7)

  // Vendas report
  const vendasReport = useMemo(() => {
    const finalizadas = vendas.filter(v => v.status === 'finalizada')
    const mesAtualVendas = finalizadas.filter(v => v.criadoEm.substring(0, 7) === mesAtual)
    const totalMes = mesAtualVendas.reduce((s, v) => s + v.total, 0)
    const qtdMes = mesAtualVendas.length

    // Payment method breakdown
    const formas: Record<string, number> = {}
    mesAtualVendas.forEach(v => {
      v.pagamentos.forEach(p => {
        formas[p.forma] = (formas[p.forma] || 0) + p.valor
      })
    })

    // Top products
    const prodMap: Record<string, { nome: string; qtd: number; total: number }> = {}
    mesAtualVendas.forEach(v => {
      v.itens.forEach(item => {
        if (!prodMap[item.produtoId]) prodMap[item.produtoId] = { nome: item.nome, qtd: 0, total: 0 }
        prodMap[item.produtoId].qtd += item.quantidade
        prodMap[item.produtoId].total += item.total
      })
    })
    const topProdutos = Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 10)

    // Top clients
    const clientMap: Record<string, { nome: string; total: number; qtd: number }> = {}
    mesAtualVendas.forEach(v => {
      const key = v.clienteNome || 'Consumidor Final'
      if (!clientMap[key]) clientMap[key] = { nome: key, total: 0, qtd: 0 }
      clientMap[key].total += v.total
      clientMap[key].qtd += 1
    })
    const topClientes = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 10)

    const canceladas = vendas.filter(v => v.status === 'cancelada' && v.criadoEm?.substring(0, 7) === mesAtual).length

    return { totalMes, qtdMes, canceladas, formas, topProdutos, topClientes, totalGeral: finalizadas.reduce((s, v) => s + v.total, 0) }
  }, [vendas, mesAtual])

  // Financial report
  const finReport = useMemo(() => {
    const cpPendentes = contasPagar.filter(c => !c.pago)
    const crPendentes = contasReceber.filter(c => !c.recebido)
    const cpAtrasadas = cpPendentes.filter(c => c.vencimento < hoje)
    const crAtrasadas = crPendentes.filter(c => c.vencimento < hoje)
    const despPendentes = despesas.filter(d => !d.pago)

    return {
      totalAPagar: cpPendentes.reduce((s, c) => s + c.valor, 0),
      totalAReceber: crPendentes.reduce((s, c) => s + c.valor, 0),
      cpAtrasadas: cpAtrasadas.length,
      crAtrasadas: crAtrasadas.length,
      totalDespPendentes: despPendentes.reduce((s, d) => s + d.valor, 0),
      totalAPagarAtrasado: cpAtrasadas.reduce((s, c) => s + c.valor, 0),
      totalAReceberAtrasado: crAtrasadas.reduce((s, c) => s + c.valor, 0),
    }
  }, [contasPagar, contasReceber, despesas, hoje])

  // Stock report
  const stockReport = useMemo(() => {
    const ativos = produtos.filter(p => p.ativo && p.tipo === 'produto')
    const baixoEstoque = ativos.filter(p => p.estoque <= p.estoqueMinimo)
    const semEstoque = ativos.filter(p => p.estoque === 0)
    const valorTotal = ativos.reduce((s, p) => s + (p.estoque * p.preco), 0)
    const valorCusto = ativos.reduce((s, p) => s + (p.estoque * (p.precoCusto || 0)), 0)

    return { total: produtos.length, ativos: ativos.length, baixoEstoque, semEstoque, valorTotal, valorCusto }
  }, [produtos])

  const formaLabel: Record<string, string> = { dinheiro: 'Dinheiro', credito: 'Credito', debito: 'Debito', pix: 'PIX', boleto: 'Boleto', crediario: 'Crediario' }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-xl font-bold text-gray-800">Relatorios</h1>

        {/* Tabs */}
        <div className="flex gap-1">
          {([
            { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
            { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
            { id: 'estoque', label: 'Estoque', icon: Box },
          ] as { id: Aba; label: string; icon: typeof ShoppingCart }[]).map(t => (
            <button key={t.id} onClick={() => setAba(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                aba === t.id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Vendas Tab */}
        {aba === 'vendas' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="card p-4"><p className="text-xs text-gray-500">Vendas do Mes</p><p className="text-lg font-bold text-green-600">{formatCurrency(vendasReport.totalMes)}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-500">Quantidade</p><p className="text-lg font-bold text-gray-800">{vendasReport.qtdMes}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-500">Ticket Medio</p><p className="text-lg font-bold text-blue-600">{formatCurrency(vendasReport.qtdMes > 0 ? vendasReport.totalMes / vendasReport.qtdMes : 0)}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-500">Canceladas</p><p className="text-lg font-bold text-red-500">{vendasReport.canceladas}</p></div>
            </div>

            {/* Formas de pagamento */}
            <div className="card p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Vendas por Forma de Pagamento (Mes)</p>
              {Object.keys(vendasReport.formas).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma venda no periodo</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(vendasReport.formas).sort(([,a], [,b]) => b - a).map(([forma, valor]) => (
                    <div key={forma} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-24">{formaLabel[forma] || forma}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div className="h-full bg-primary rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(10, (valor / vendasReport.totalMes) * 100)}%` }}>
                          <span className="text-xs text-white font-medium">{((valor / vendasReport.totalMes) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-800 w-24 text-right">{formatCurrency(valor)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Produtos */}
            <div className="card p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Top 10 Produtos Mais Vendidos (Mes)</p>
              {vendasReport.topProdutos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma venda no periodo</p>
              ) : (
                <div className="space-y-2">
                  {vendasReport.topProdutos.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="w-6 text-gray-400 font-medium">{i + 1}.</span>
                      <span className="flex-1 truncate text-gray-800">{p.nome}</span>
                      <span className="text-gray-500">{p.qtd} un</span>
                      <span className="font-medium text-gray-800 w-24 text-right">{formatCurrency(p.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Clientes */}
            <div className="card p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Top 10 Clientes (Mes)</p>
              {vendasReport.topClientes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma venda no periodo</p>
              ) : (
                <div className="space-y-2">
                  {vendasReport.topClientes.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="w-6 text-gray-400 font-medium">{i + 1}.</span>
                      <span className="flex-1 truncate text-gray-800">{c.nome}</span>
                      <span className="text-gray-500">{c.qtd} venda(s)</span>
                      <span className="font-medium text-gray-800 w-24 text-right">{formatCurrency(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financeiro Tab */}
        {aba === 'financeiro' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown size={16} className="text-red-500" />
                  <p className="text-xs text-gray-500">Total a Pagar</p>
                </div>
                <p className="text-lg font-bold text-red-500">{formatCurrency(finReport.totalAPagar)}</p>
                {finReport.cpAtrasadas > 0 && <p className="text-xs text-red-400 mt-1">{finReport.cpAtrasadas} atrasada(s): {formatCurrency(finReport.totalAPagarAtrasado)}</p>}
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-green-600" />
                  <p className="text-xs text-gray-500">Total a Receber</p>
                </div>
                <p className="text-lg font-bold text-green-600">{formatCurrency(finReport.totalAReceber)}</p>
                {finReport.crAtrasadas > 0 && <p className="text-xs text-red-400 mt-1">{finReport.crAtrasadas} atrasada(s): {formatCurrency(finReport.totalAReceberAtrasado)}</p>}
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500">Despesas Pendentes</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(finReport.totalDespPendentes)}</p>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Balanco Geral</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">A Receber</span>
                  <span className="text-green-600 font-medium">+{formatCurrency(finReport.totalAReceber)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">A Pagar</span>
                  <span className="text-red-500 font-medium">-{formatCurrency(finReport.totalAPagar)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Despesas Pendentes</span>
                  <span className="text-red-500 font-medium">-{formatCurrency(finReport.totalDespPendentes)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Saldo Projetado</span>
                  <span className={finReport.totalAReceber - finReport.totalAPagar - finReport.totalDespPendentes >= 0 ? 'text-green-600' : 'text-red-500'}>
                    {formatCurrency(finReport.totalAReceber - finReport.totalAPagar - finReport.totalDespPendentes)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estoque Tab */}
        {aba === 'estoque' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="card p-4"><p className="text-xs text-gray-500">Total Produtos</p><p className="text-lg font-bold text-gray-800">{stockReport.total}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-500">Ativos</p><p className="text-lg font-bold text-green-600">{stockReport.ativos}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-500">Valor Estoque (Venda)</p><p className="text-lg font-bold text-blue-600">{formatCurrency(stockReport.valorTotal)}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-500">Valor Estoque (Custo)</p><p className="text-lg font-bold text-gray-600">{formatCurrency(stockReport.valorCusto)}</p></div>
            </div>

            {stockReport.baixoEstoque.length > 0 && (
              <div className="card p-4">
                <p className="text-sm font-semibold text-red-600 mb-3">Produtos com Estoque Baixo ({stockReport.baixoEstoque.length})</p>
                <div className="space-y-2">
                  {stockReport.baixoEstoque.map(p => (
                    <div key={p._id} className="flex items-center gap-3 text-sm bg-red-50 rounded-lg px-3 py-2">
                      <span className="flex-1 truncate text-gray-800">{p.nome}</span>
                      <span className="text-red-600 font-medium">Estoque: {p.estoque}</span>
                      <span className="text-gray-500">Min: {p.estoqueMinimo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Resumo Geral</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Clientes cadastrados</span><span className="font-medium">{clientes.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Clientes ativos</span><span className="font-medium">{clientes.filter(c => c.ativo).length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Produtos sem estoque</span><span className="font-medium text-red-500">{stockReport.semEstoque.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Estoque baixo</span><span className="font-medium text-orange-600">{stockReport.baixoEstoque.length}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
