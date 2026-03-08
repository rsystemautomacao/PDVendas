import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Search, FileText, Clock, CheckCircle2,
  XCircle, ChevronRight, ArrowRightCircle,
  Send,
} from 'lucide-react'
import { useOrdensServico } from '../../contexts/OrdemServicoContext'
import { formatCurrency } from '../../utils/helpers'
import type { StatusOrcamento } from '../../types'

const statusConfig: Record<StatusOrcamento, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: Send },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  recusado: { label: 'Recusado', color: 'bg-red-100 text-red-700', icon: XCircle },
  expirado: { label: 'Expirado', color: 'bg-gray-100 text-gray-600', icon: Clock },
  convertido: { label: 'Convertido em OS', color: 'bg-purple-100 text-purple-700', icon: ArrowRightCircle },
}

export function OrcamentosPage() {
  const navigate = useNavigate()
  const { orcamentos, converterOrcamentoEmOS } = useOrdensServico()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [convertendo, setConvertendo] = useState<string | null>(null)

  const orcFiltrados = useMemo(() => {
    return orcamentos.filter(orc => {
      if (filtroStatus && orc.status !== filtroStatus) return false
      if (busca) {
        const termo = busca.toLowerCase()
        return (
          orc.numero.toString().includes(termo) ||
          orc.clienteNome.toLowerCase().includes(termo) ||
          orc.dispositivo.marca.toLowerCase().includes(termo) ||
          orc.dispositivo.modelo.toLowerCase().includes(termo) ||
          orc.defeitoRelatado.toLowerCase().includes(termo)
        )
      }
      return true
    })
  }, [orcamentos, busca, filtroStatus])

  const resumo = useMemo(() => {
    const pendentes = orcamentos.filter(o => ['pendente', 'enviado'].includes(o.status)).length
    const aprovados = orcamentos.filter(o => o.status === 'aprovado').length
    const recusados = orcamentos.filter(o => o.status === 'recusado').length
    const convertidos = orcamentos.filter(o => o.status === 'convertido').length
    return { pendentes, aprovados, recusados, convertidos }
  }, [orcamentos])

  const handleConverter = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (convertendo) return
    setConvertendo(id)
    const os = await converterOrcamentoEmOS(id)
    setConvertendo(null)
    if (os) {
      navigate(`/app/ordens-servico/${os._id}`)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Orcamentos</h1>
            <p className="text-sm text-gray-500 mt-1">{orcamentos.length} orcamentos cadastrados</p>
          </div>
          <Link
            to="/app/orcamentos/novo"
            className="btn-primary flex items-center gap-2 self-start"
          >
            <Plus size={18} /> Novo Orcamento
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card text-center">
            <p className="text-2xl font-bold text-yellow-600">{resumo.pendentes}</p>
            <p className="text-xs text-gray-500 mt-1">Pendentes</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card text-center">
            <p className="text-2xl font-bold text-green-600">{resumo.aprovados}</p>
            <p className="text-xs text-gray-500 mt-1">Aprovados</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card text-center">
            <p className="text-2xl font-bold text-red-600">{resumo.recusados}</p>
            <p className="text-xs text-gray-500 mt-1">Recusados</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card text-center">
            <p className="text-2xl font-bold text-purple-600">{resumo.convertidos}</p>
            <p className="text-xs text-gray-500 mt-1">Convertidos em OS</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por numero, cliente, aparelho, defeito..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="input-field pl-9 w-full"
              />
            </div>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="enviado">Enviado</option>
              <option value="aprovado">Aprovado</option>
              <option value="recusado">Recusado</option>
              <option value="expirado">Expirado</option>
              <option value="convertido">Convertido em OS</option>
            </select>
          </div>
        </div>

        {/* List */}
        {orcFiltrados.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={48} className="mb-3 opacity-40" />
            <p className="text-lg font-medium">Nenhum orcamento encontrado</p>
            <p className="text-sm mt-1">Crie um novo orcamento para comecar</p>
            <Link to="/app/orcamentos/novo" className="btn-primary mt-4 text-sm">
              <Plus size={16} className="inline mr-1" /> Criar Orcamento
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-gray-50 overflow-hidden">
            {orcFiltrados.map(orc => {
              const sc = statusConfig[orc.status]
              const StatusIcon = sc.icon
              return (
                <div
                  key={orc._id}
                  onClick={() => navigate(`/app/orcamentos/${orc._id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent-pale">
                    <FileText size={20} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-800">Orc #{orc.numero}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                        <StatusIcon size={12} /> {sc.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{orc.clienteNome}</p>
                    <p className="text-xs text-gray-400">
                      {orc.dispositivo.marca} {orc.dispositivo.modelo} — {orc.itens.length} ite{orc.itens.length === 1 ? 'm' : 'ns'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:flex sm:flex-col sm:items-end gap-1">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(orc.total)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(orc.criadoEm).toLocaleDateString('pt-BR')}
                    </p>
                    {orc.status === 'aprovado' && (
                      <button
                        onClick={(e) => handleConverter(e, orc._id)}
                        disabled={convertendo === orc._id}
                        className="text-xs text-primary font-medium hover:underline disabled:opacity-50"
                      >
                        {convertendo === orc._id ? 'Convertendo...' : 'Gerar OS'}
                      </button>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
