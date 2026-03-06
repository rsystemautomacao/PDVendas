import { useState, useMemo } from 'react'
import { Package, PackageCheck, Plus, ArrowDownCircle, ArrowUpCircle, X, Eye, LayoutDashboard } from 'lucide-react'
import { useCaixa } from '../../contexts/CaixaContext'
import { formatCurrency, formatDateTime } from '../../utils/helpers'
import type { Caixa } from '../../types'

export function CaixasPage() {
  const { caixas, caixaAberto, abrirCaixa, fecharCaixa, registrarMovimentacao } = useCaixa()

  const [aba, setAba] = useState<'abertos' | 'fechados'>('abertos')
  const [showAbrirModal, setShowAbrirModal] = useState(false)
  const [showFecharModal, setShowFecharModal] = useState(false)
  const [showMovModal, setShowMovModal] = useState<'reforco' | 'sangria' | null>(null)
  const [showDetalhe, setShowDetalhe] = useState<Caixa | null>(null)

  const [valorAbertura, setValorAbertura] = useState('0')
  const [valorMov, setValorMov] = useState('')
  const [descricaoMov, setDescricaoMov] = useState('')
  const [obsFechar, setObsFechar] = useState('')

  const caixasFechados = useMemo(() =>
    caixas.filter(c => c.status === 'fechado').sort((a, b) => (b.fechadoEm || '').localeCompare(a.fechadoEm || '')),
    [caixas]
  )

  const handleAbrir = () => {
    const val = parseFloat(valorAbertura) || 0
    abrirCaixa(val)
    setShowAbrirModal(false)
    setValorAbertura('0')
  }

  const handleFechar = () => {
    if (!caixaAberto) return
    fecharCaixa(caixaAberto._id, obsFechar.trim() || undefined)
    setShowFecharModal(false)
    setObsFechar('')
  }

  const handleMov = () => {
    if (!caixaAberto || !showMovModal || !valorMov) return
    const val = parseFloat(valorMov) || 0
    if (val <= 0) return
    registrarMovimentacao(caixaAberto._id, {
      tipo: showMovModal,
      valor: val,
      descricao: descricaoMov.trim() || (showMovModal === 'reforco' ? 'Reforco de caixa' : 'Sangria de caixa'),
    })
    setShowMovModal(null)
    setValorMov('')
    setDescricaoMov('')
  }

  const saldoAtual = caixaAberto ? caixaAberto.totalEntradas - caixaAberto.totalSaidas : 0

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Caixas</h1>
            <p className="text-sm text-gray-500">
              {caixaAberto ? `Caixa #${caixaAberto.numero} aberto` : 'Nenhum caixa aberto'}
            </p>
          </div>
          {!caixaAberto && (
            <button onClick={() => setShowAbrirModal(true)} className="btn-primary">
              <Plus size={18} /> Abrir Caixa
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button onClick={() => setAba('abertos')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              aba === 'abertos' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <Package size={16} /> Caixa Aberto
          </button>
          <button onClick={() => setAba('fechados')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              aba === 'fechados' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <PackageCheck size={16} /> Historico ({caixasFechados.length})
          </button>
        </div>

        {/* Tab: Caixa Aberto */}
        {aba === 'abertos' && (
          <>
            {caixaAberto ? (
              <div className="space-y-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="card p-4">
                    <p className="text-xs text-gray-500">Abertura</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(caixaAberto.valorAbertura)}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs text-gray-500">Total Vendas</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(caixaAberto.totalVendas)}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs text-gray-500">Entradas</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(caixaAberto.totalEntradas)}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs text-gray-500">Saidas</p>
                    <p className="text-lg font-bold text-red-500">{formatCurrency(caixaAberto.totalSaidas)}</p>
                  </div>
                </div>

                {/* Saldo */}
                <div className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Saldo Atual do Caixa</p>
                    <p className="text-xs text-gray-400">Caixa #{caixaAberto.numero} - Aberto em {formatDateTime(caixaAberto.abertoEm)}</p>
                    <p className="text-xs text-gray-400">Operador: {caixaAberto.operadorNome}</p>
                  </div>
                  <p className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(saldoAtual)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowMovModal('reforco')} className="btn-primary">
                    <ArrowDownCircle size={16} /> Reforco
                  </button>
                  <button onClick={() => setShowMovModal('sangria')} className="btn-secondary">
                    <ArrowUpCircle size={16} /> Sangria
                  </button>
                  <button onClick={() => setShowFecharModal(true)} className="btn-danger ml-auto">
                    <PackageCheck size={16} /> Fechar Caixa
                  </button>
                </div>

                {/* Movimentacoes */}
                <div className="card">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-semibold text-gray-700">Movimentacoes ({caixaAberto.movimentacoes.length})</p>
                  </div>
                  {caixaAberto.movimentacoes.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400 text-center">Nenhuma movimentacao</p>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                      {[...caixaAberto.movimentacoes].reverse().map(m => (
                        <div key={m._id} className="flex items-center gap-3 px-4 py-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            m.tipo === 'venda' ? 'bg-green-100 text-green-600' :
                            m.tipo === 'reforco' ? 'bg-blue-100 text-blue-600' :
                            m.tipo === 'sangria' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {m.tipo === 'venda' ? <LayoutDashboard size={14} /> :
                             m.tipo === 'reforco' ? <ArrowDownCircle size={14} /> :
                             <ArrowUpCircle size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{m.descricao}</p>
                            <p className="text-xs text-gray-400">{formatDateTime(m.criadoEm)}</p>
                          </div>
                          <p className={`text-sm font-bold flex-shrink-0 ${
                            m.tipo === 'sangria' ? 'text-red-500' : 'text-green-600'
                          }`}>
                            {m.tipo === 'sangria' ? '-' : '+'}{formatCurrency(m.valor)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center py-16">
                <Package size={48} className="text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Nenhum caixa aberto</p>
                <p className="text-sm text-gray-400 mt-1">Abra um caixa para comecar a vender</p>
                <button onClick={() => setShowAbrirModal(true)} className="btn-primary mt-4">
                  <Plus size={16} /> Abrir Caixa
                </button>
              </div>
            )}
          </>
        )}

        {/* Tab: Caixas Fechados */}
        {aba === 'fechados' && (
          <>
            {caixasFechados.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-16">
                <PackageCheck size={48} className="text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Nenhum caixa fechado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {caixasFechados.map(c => (
                  <div key={c._id} className="card p-4 flex items-center gap-4 cursor-pointer hover:border-primary/20 transition-colors"
                    onClick={() => setShowDetalhe(c)}>
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">#{c.numero}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800">Caixa #{c.numero}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                        <span>Aberto: {formatDateTime(c.abertoEm)}</span>
                        <span>Fechado: {formatDateTime(c.fechadoEm || '')}</span>
                        <span>Operador: {c.operadorNome}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">Saldo Final</p>
                      <p className="text-sm font-bold text-gray-800">{formatCurrency(c.valorFechamento || 0)}</p>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                      onClick={e => { e.stopPropagation(); setShowDetalhe(c) }}>
                      <Eye size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Abrir Caixa */}
      {showAbrirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Abrir Caixa</h3>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Valor de Abertura (troco inicial)</label>
              <input type="number" step="0.01" value={valorAbertura} onChange={e => setValorAbertura(e.target.value)}
                placeholder="0.00" className="input-field" autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAbrirModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleAbrir} className="btn-primary flex-1">Abrir Caixa</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Fechar Caixa */}
      {showFecharModal && caixaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Fechar Caixa #{caixaAberto.numero}</h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Entradas</span><span className="text-green-600 font-medium">{formatCurrency(caixaAberto.totalEntradas)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Saidas</span><span className="text-red-500 font-medium">{formatCurrency(caixaAberto.totalSaidas)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Saldo Final</span><span>{formatCurrency(saldoAtual)}</span></div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Observacoes (opcional)</label>
              <textarea value={obsFechar} onChange={e => setObsFechar(e.target.value)}
                placeholder="Observacoes do fechamento..." rows={2} className="input-field resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowFecharModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleFechar} className="btn-danger flex-1">Fechar Caixa</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reforco / Sangria */}
      {showMovModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {showMovModal === 'reforco' ? 'Reforco de Caixa' : 'Sangria de Caixa'}
            </h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Valor *</label>
                <input type="number" step="0.01" value={valorMov} onChange={e => setValorMov(e.target.value)}
                  placeholder="0.00" className="input-field" autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Descricao</label>
                <input type="text" value={descricaoMov} onChange={e => setDescricaoMov(e.target.value)}
                  placeholder={showMovModal === 'reforco' ? 'Ex: Troco adicional' : 'Ex: Pagamento fornecedor'}
                  className="input-field" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowMovModal(null); setValorMov(''); setDescricaoMov('') }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleMov} disabled={!valorMov || parseFloat(valorMov) <= 0} className="btn-primary flex-1">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhe do Caixa Fechado */}
      {showDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowDetalhe(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">Caixa #{showDetalhe.numero}</h3>
              <button onClick={() => setShowDetalhe(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Operador:</span><p className="font-medium">{showDetalhe.operadorNome}</p></div>
                <div><span className="text-gray-500">Aberto em:</span><p className="font-medium">{formatDateTime(showDetalhe.abertoEm)}</p></div>
                <div><span className="text-gray-500">Fechado em:</span><p className="font-medium">{formatDateTime(showDetalhe.fechadoEm || '')}</p></div>
                <div><span className="text-gray-500">Abertura:</span><p className="font-medium">{formatCurrency(showDetalhe.valorAbertura)}</p></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Vendas</span><span className="font-medium">{formatCurrency(showDetalhe.totalVendas)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Entradas</span><span className="text-green-600 font-medium">{formatCurrency(showDetalhe.totalEntradas)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Saidas</span><span className="text-red-500 font-medium">{formatCurrency(showDetalhe.totalSaidas)}</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>Saldo Final</span><span>{formatCurrency(showDetalhe.valorFechamento || 0)}</span></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Movimentacoes ({showDetalhe.movimentacoes.length})</p>
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                  {showDetalhe.movimentacoes.map(m => (
                    <div key={m._id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{m.descricao}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(m.criadoEm)}</p>
                      </div>
                      <p className={`font-semibold ${m.tipo === 'sangria' ? 'text-red-500' : 'text-green-600'}`}>
                        {m.tipo === 'sangria' ? '-' : '+'}{formatCurrency(m.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {showDetalhe.observacoes && (
                <div className="text-sm text-gray-500"><span className="font-medium">Obs:</span> {showDetalhe.observacoes}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
