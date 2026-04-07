import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, Plus, Edit, Trash2, Users, Phone, Mail } from 'lucide-react'
import { useClientes } from '../../contexts/ClienteContext'
import { TutorialModal } from '../../components/app/TutorialModal'
import { tutorialClientes } from '../../config/tutorials'

export function ClientesPage() {
  const navigate = useNavigate()
  const { clientes, removerCliente } = useClientes()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'ativos' | 'inativos' | 'todos'>('ativos')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return clientes.filter(c => {
      if (filtroStatus === 'ativos' && !c.ativo) return false
      if (filtroStatus === 'inativos' && c.ativo) return false
      if (busca) {
        const t = busca.toLowerCase()
        return c.nome.toLowerCase().includes(t) || (c.cpfCnpj || '').includes(t) || (c.email || '').toLowerCase().includes(t) || (c.telefone || '').includes(t)
      }
      return true
    })
  }, [clientes, busca, filtroStatus])

  const handleDelete = (id: string) => {
    removerCliente(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Clientes</h1>
            <p className="text-sm text-gray-500">{filtered.length} registro(s)</p>
          </div>
          <Link to="/app/clientes/novo" className="btn-primary">
            <Plus size={18} /> Novo Cliente
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
                  placeholder="Nome, CPF/CNPJ, e-mail ou telefone" className="input-field pl-9" />
              </div>
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)} className="input-field">
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Client list */}
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16">
            <Users size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhum cliente encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Cadastre um novo cliente para comecar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c._id} className="card p-4 flex items-center gap-4 hover:border-primary/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/app/clientes/${c._id}`)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  c.tipo === 'juridica' ? 'bg-purple-100 text-purple-600' : 'bg-primary/10 text-primary'
                }`}>
                  <span className="text-sm font-bold">{c.nome.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">{c.nome}</p>
                    {!c.ativo && <span className="badge badge-gray">Inativo</span>}
                    <span className="badge badge-info">{c.tipo === 'fisica' ? 'PF' : 'PJ'}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    {c.cpfCnpj && <span>{c.cpfCnpj}</span>}
                    {c.email && <span className="flex items-center gap-1"><Mail size={10} />{c.email}</span>}
                    {(c.telefone || c.celular) && <span className="flex items-center gap-1"><Phone size={10} />{c.celular || c.telefone}</span>}
                  </div>
                </div>
                {c.saldoDevedor > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Saldo devedor</p>
                    <p className="text-sm font-bold text-red-500">R$ {c.saldoDevedor.toFixed(2)}</p>
                  </div>
                )}
                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => navigate(`/app/clientes/${c._id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => setConfirmDelete(c._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar exclusao</h3>
            <p className="text-sm text-gray-600 mb-6">Tem certeza que deseja remover este cliente?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="btn-danger flex-1">Remover</button>
            </div>
          </div>
        </div>
      )}
      <TutorialModal id="clientes" titulo="Gerenciamento de Clientes" subtitulo="Cadastre e controle seus clientes" steps={tutorialClientes} />
    </div>
  )
}
