import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, XCircle, CheckCircle, Edit, Search } from 'lucide-react'
import { useProdutos } from '../../contexts/ProdutoContext'
import { formatCurrency } from '../../utils/helpers'

export function ValidadePage() {
  const navigate = useNavigate()
  const { produtos } = useProdutos()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'vencidos' | 'proximos' | 'ok'>('todos')

  const hoje = new Date().toISOString().substring(0, 10)

  const produtosComValidade = useMemo(() => {
    return produtos
      .filter(p => p.ativo && p.validade)
      .map(p => {
        const diasRestantes = Math.ceil(
          (new Date(p.validade! + 'T00:00:00').getTime() - new Date(hoje + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)
        )
        let status: 'vencido' | 'critico' | 'atencao' | 'ok'
        if (diasRestantes < 0) status = 'vencido'
        else if (diasRestantes <= 7) status = 'critico'
        else if (diasRestantes <= 30) status = 'atencao'
        else status = 'ok'
        return { ...p, diasRestantes, status }
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
  }, [produtos, hoje])

  const filtered = useMemo(() => {
    return produtosComValidade.filter(p => {
      if (filtro === 'vencidos' && p.status !== 'vencido') return false
      if (filtro === 'proximos' && p.status !== 'critico' && p.status !== 'atencao') return false
      if (filtro === 'ok' && p.status !== 'ok') return false
      if (busca) {
        const t = busca.toLowerCase()
        return p.nome.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t)
      }
      return true
    })
  }, [produtosComValidade, filtro, busca])

  const resumo = useMemo(() => ({
    vencidos: produtosComValidade.filter(p => p.status === 'vencido').length,
    criticos: produtosComValidade.filter(p => p.status === 'critico').length,
    atencao: produtosComValidade.filter(p => p.status === 'atencao').length,
    ok: produtosComValidade.filter(p => p.status === 'ok').length,
    total: produtosComValidade.length,
  }), [produtosComValidade])

  const statusConfig = {
    vencido: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', badge: 'badge badge-red', label: 'Vencido' },
    critico: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', badge: 'badge badge-yellow', label: 'Critico' },
    atencao: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', badge: 'badge badge-yellow', label: 'Atencao' },
    ok: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200', badge: 'badge badge-green', label: 'OK' },
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle size={22} className="text-primary" /> Controle de Validade
          </h1>
          <p className="text-sm text-gray-500 mt-1">{resumo.total} produto(s) com data de validade cadastrada</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => setFiltro('vencidos')} className={`card p-3 text-center transition-all ${filtro === 'vencidos' ? 'ring-2 ring-red-400' : ''}`}>
            <XCircle size={20} className="text-red-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Vencidos</p>
            <p className="text-lg font-bold text-red-600">{resumo.vencidos}</p>
          </button>
          <button onClick={() => setFiltro('proximos')} className={`card p-3 text-center transition-all ${filtro === 'proximos' ? 'ring-2 ring-amber-400' : ''}`}>
            <AlertTriangle size={20} className="text-amber-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Proximo ao venc.</p>
            <p className="text-lg font-bold text-amber-600">{resumo.criticos + resumo.atencao}</p>
          </button>
          <button onClick={() => setFiltro('ok')} className={`card p-3 text-center transition-all ${filtro === 'ok' ? 'ring-2 ring-green-400' : ''}`}>
            <CheckCircle size={20} className="text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Em dia</p>
            <p className="text-lg font-bold text-green-600">{resumo.ok}</p>
          </button>
          <button onClick={() => setFiltro('todos')} className={`card p-3 text-center transition-all ${filtro === 'todos' ? 'ring-2 ring-primary' : ''}`}>
            <Clock size={20} className="text-primary mx-auto mb-1" />
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-800">{resumo.total}</p>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} className="input-field pl-9" />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16">
            <CheckCircle size={48} className="text-gray-200 mb-3" />
            <p className="text-gray-400">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => {
              const cfg = statusConfig[p.status]
              const Icon = cfg.icon
              return (
                <div key={p._id} className={`card p-4 flex items-center gap-4 border ${cfg.bg}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color} bg-white`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-800 truncate">{p.nome}</p>
                      <span className={cfg.badge}>{cfg.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                      <span>Cod: {p.codigo}</span>
                      <span>Estoque: {p.estoque} {p.unidade}</span>
                      <span>Validade: {new Date(p.validade! + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      <span className={`font-semibold ${p.diasRestantes < 0 ? 'text-red-600' : p.diasRestantes <= 7 ? 'text-orange-600' : p.diasRestantes <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                        {p.diasRestantes < 0 ? `Vencido ha ${Math.abs(p.diasRestantes)} dia(s)` : p.diasRestantes === 0 ? 'Vence HOJE' : `${p.diasRestantes} dia(s) restante(s)`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <p className="text-sm font-bold text-gray-700">{formatCurrency(p.preco)}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/app/produtos/${p._id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/80 text-gray-400 hover:text-primary transition-colors flex-shrink-0"
                    title="Editar produto"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {produtosComValidade.length === 0 && (
          <div className="text-center text-sm text-gray-400 mt-4">
            Cadastre a data de validade nos produtos para acompanhar aqui.
          </div>
        )}
      </div>
    </div>
  )
}
