import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Search, Wrench, Clock, CheckCircle2,
  XCircle, AlertTriangle, Smartphone,
  ChevronRight, Truck,
} from 'lucide-react'
import { useOrdensServico } from '../../contexts/OrdemServicoContext'
import { formatCurrency } from '../../utils/helpers'
import type { StatusOS } from '../../types'
import { TutorialModal } from '../../components/app/TutorialModal'
import { tutorialOrdensServico } from '../../config/tutorials'

const statusConfig: Record<StatusOS, { label: string; color: string; icon: typeof Clock }> = {
  aberta: { label: 'Aberta', color: 'bg-blue-100 text-blue-700', icon: Clock },
  em_analise: { label: 'Em Analise', color: 'bg-yellow-100 text-yellow-700', icon: Search },
  orcamento_enviado: { label: 'Orc. Enviado', color: 'bg-purple-100 text-purple-700', icon: ChevronRight },
  aprovada: { label: 'Aprovada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  em_execucao: { label: 'Em Execucao', color: 'bg-orange-100 text-orange-700', icon: Wrench },
  concluida: { label: 'Concluida', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  entregue: { label: 'Entregue', color: 'bg-gray-100 text-gray-600', icon: Truck },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'text-gray-500' },
  normal: { label: 'Normal', color: 'text-blue-600' },
  alta: { label: 'Alta', color: 'text-orange-600' },
  urgente: { label: 'Urgente', color: 'text-red-600' },
}

export function OrdensServicoPage() {
  const navigate = useNavigate()
  const { ordensServico } = useOrdensServico()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('')

  const osFiltradas = useMemo(() => {
    return ordensServico.filter(os => {
      if (filtroStatus && os.status !== filtroStatus) return false
      if (filtroPrioridade && os.prioridade !== filtroPrioridade) return false
      if (busca) {
        const termo = busca.toLowerCase()
        return (
          os.numero.toString().includes(termo) ||
          os.clienteNome.toLowerCase().includes(termo) ||
          os.dispositivo.marca.toLowerCase().includes(termo) ||
          os.dispositivo.modelo.toLowerCase().includes(termo) ||
          os.defeitoRelatado.toLowerCase().includes(termo)
        )
      }
      return true
    })
  }, [ordensServico, busca, filtroStatus, filtroPrioridade])

  const resumo = useMemo(() => {
    const abertas = ordensServico.filter(os => !['cancelada', 'entregue'].includes(os.status)).length
    const emExecucao = ordensServico.filter(os => os.status === 'em_execucao').length
    const concluidas = ordensServico.filter(os => os.status === 'concluida').length
    const urgentes = ordensServico.filter(os => os.prioridade === 'urgente' && !['cancelada', 'entregue'].includes(os.status)).length
    return { abertas, emExecucao, concluidas, urgentes }
  }, [ordensServico])

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Ordens de Servico</h1>
            <p className="text-sm text-gray-500 mt-1">{ordensServico.length} OS cadastradas</p>
          </div>
          <Link
            to="/app/ordens-servico/nova"
            className="btn-primary flex items-center gap-2 self-start"
          >
            <Plus size={18} /> Nova OS
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card text-center">
            <p className="text-2xl font-bold text-blue-600">{resumo.abertas}</p>
            <p className="text-xs text-gray-500 mt-1">Em andamento</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card text-center">
            <p className="text-2xl font-bold text-orange-600">{resumo.emExecucao}</p>
            <p className="text-xs text-gray-500 mt-1">Em execucao</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card text-center">
            <p className="text-2xl font-bold text-green-600">{resumo.concluidas}</p>
            <p className="text-xs text-gray-500 mt-1">Concluidas</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card text-center">
            <p className="text-2xl font-bold text-red-600">{resumo.urgentes}</p>
            <p className="text-xs text-gray-500 mt-1">Urgentes</p>
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
            <div className="flex gap-2">
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Todos os status</option>
                <option value="aberta">Aberta</option>
                <option value="em_analise">Em Analise</option>
                <option value="orcamento_enviado">Orc. Enviado</option>
                <option value="aprovada">Aprovada</option>
                <option value="em_execucao">Em Execucao</option>
                <option value="concluida">Concluida</option>
                <option value="entregue">Entregue</option>
                <option value="cancelada">Cancelada</option>
              </select>
              <select
                value={filtroPrioridade}
                onChange={e => setFiltroPrioridade(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Prioridade</option>
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        {osFiltradas.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
            <Wrench size={48} className="mb-3 opacity-40" />
            <p className="text-lg font-medium">Nenhuma OS encontrada</p>
            <p className="text-sm mt-1">Crie uma nova ordem de servico para comecar</p>
            <Link to="/app/ordens-servico/nova" className="btn-primary mt-4 text-sm">
              <Plus size={16} className="inline mr-1" /> Criar OS
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-gray-50 overflow-hidden">
            {osFiltradas.map(os => {
              const sc = statusConfig[os.status]
              const pc = prioridadeConfig[os.prioridade]
              const StatusIcon = sc.icon
              return (
                <div
                  key={os._id}
                  onClick={() => navigate(`/app/ordens-servico/${os._id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Smartphone size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-800">OS #{os.numero}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                        <StatusIcon size={12} /> {sc.label}
                      </span>
                      {os.prioridade !== 'normal' && (
                        <span className={`text-xs font-semibold ${pc.color}`}>
                          {os.prioridade === 'urgente' && <AlertTriangle size={12} className="inline mr-0.5" />}
                          {pc.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{os.clienteNome}</p>
                    <p className="text-xs text-gray-400">
                      {os.dispositivo.marca} {os.dispositivo.modelo} — {os.defeitoRelatado.substring(0, 60)}{os.defeitoRelatado.length > 60 ? '...' : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(os.total)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(os.criadoEm).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </div>
      <TutorialModal id="ordens-servico" titulo="Ordens de Servico" subtitulo="Gerencie servicos e assistencia tecnica" steps={tutorialOrdensServico} />
    </div>
  )
}
