import { useState, useMemo, useEffect } from 'react'
import { DollarSign, TrendingUp, Users } from 'lucide-react'
import { useVendas } from '../../contexts/VendaContext'
import { formatCurrency } from '../../utils/helpers'

export function ComissoesPage() {
  const { vendas, carregarSeNecessario: carregarVendas } = useVendas()
  useEffect(() => { carregarVendas() }, [carregarVendas])

  const hoje = new Date().toISOString().substring(0, 10)
  const mesInicio = hoje.substring(0, 7) + '-01'

  const [dataDe, setDataDe] = useState(mesInicio)
  const [dataAte, setDataAte] = useState(hoje)

  const comissoes = useMemo(() => {
    const filtradas = vendas.filter(v => {
      if (v.status !== 'finalizada') return false
      const data = v.criadoEm.substring(0, 10)
      if (dataDe && data < dataDe) return false
      if (dataAte && data > dataAte) return false
      return true
    })

    // Agrupar por vendedor
    const porVendedor: Record<string, { nome: string; totalVendas: number; qtdVendas: number }> = {}
    for (const v of filtradas) {
      const key = v.vendedorId
      if (!porVendedor[key]) {
        porVendedor[key] = { nome: v.vendedorNome, totalVendas: 0, qtdVendas: 0 }
      }
      porVendedor[key].totalVendas += v.total
      porVendedor[key].qtdVendas += 1
    }

    return Object.entries(porVendedor)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalVendas - a.totalVendas)
  }, [vendas, dataDe, dataAte])

  const [usuarios, setUsuarios] = useState<{ _id: string; nome: string; comissao: number }[]>([])

  useEffect(() => {
    import('../../services/api').then(({ api }) => {
      api.get('/usuarios').then(res => {
        if (res.success) setUsuarios(res.data || [])
      }).catch(() => {})
    })
  }, [])

  const comissoesComTaxa = useMemo(() => {
    return comissoes.map(c => {
      const user = usuarios.find(u => u._id === c.id)
      const taxa = user?.comissao || 0
      const valorComissao = (c.totalVendas * taxa) / 100
      return { ...c, taxa, valorComissao }
    })
  }, [comissoes, usuarios])

  const totais = useMemo(() => ({
    vendas: comissoesComTaxa.reduce((s, c) => s + c.totalVendas, 0),
    comissoes: comissoesComTaxa.reduce((s, c) => s + c.valorComissao, 0),
    vendedores: comissoesComTaxa.length,
  }), [comissoesComTaxa])

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={22} className="text-primary" /> Comissoes de Vendedores
          </h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe as comissoes por periodo</p>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <label className="text-sm font-medium text-gray-700 mb-1 block">De</label>
            <input type="date" value={dataDe} onChange={e => setDataDe(e.target.value)} className="input-field" />
          </div>
          <div className="w-40">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Ate</label>
            <input type="date" value={dataAte} onChange={e => setDataAte(e.target.value)} className="input-field" />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <DollarSign size={20} className="text-primary mx-auto mb-1" />
            <p className="text-xs text-gray-500">Total Vendas</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(totais.vendas)}</p>
          </div>
          <div className="card p-4 text-center">
            <TrendingUp size={20} className="text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Total Comissoes</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totais.comissoes)}</p>
          </div>
          <div className="card p-4 text-center">
            <Users size={20} className="text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Vendedores</p>
            <p className="text-lg font-bold text-blue-600">{totais.vendedores}</p>
          </div>
        </div>

        {/* Table */}
        {comissoesComTaxa.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16">
            <Users size={48} className="text-gray-200 mb-3" />
            <p className="text-gray-400">Nenhuma venda no periodo</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3 text-left">Vendedor</th>
                  <th className="px-4 py-3 text-center">Vendas</th>
                  <th className="px-4 py-3 text-right">Total Vendido</th>
                  <th className="px-4 py-3 text-center">Taxa %</th>
                  <th className="px-4 py-3 text-right">Comissao</th>
                </tr>
              </thead>
              <tbody>
                {comissoesComTaxa.map(c => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-700">{c.nome}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{c.qtdVendas}</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-medium">{formatCurrency(c.totalVendas)}</td>
                    <td className="px-4 py-3 text-center">
                      {c.taxa > 0 ? (
                        <span className="badge badge-info">{c.taxa}%</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Nao definida</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(c.valorComissao)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <td className="px-4 py-3 text-gray-700">Total</td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {comissoesComTaxa.reduce((s, c) => s + c.qtdVendas, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(totais.vendas)}</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(totais.comissoes)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="text-xs text-gray-400 text-center">
          Configure o percentual de comissao de cada vendedor em Configuracoes &gt; Usuarios
        </div>
      </div>
    </div>
  )
}
