import { useState, useEffect, useCallback, useMemo } from 'react'
import { Users, Plus, Pencil, Trash2, X, Save, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { api } from '../../../services/api'
import { Switch } from '../../../components/app/Switch'
import type { User } from '../../../types'

const PAPEIS = [
  { value: 'gerente', label: 'Gerente' },
  { value: 'caixa', label: 'Operador de Caixa' },
]

const PERMISSOES_GRUPOS: { titulo: string; itens: { id: string; label: string }[] }[] = [
  {
    titulo: 'Vendas',
    itens: [
      { id: 'vendas.criar', label: 'Criar vendas' },
      { id: 'vendas.visualizar', label: 'Visualizar vendas' },
      { id: 'vendas.cancelar', label: 'Cancelar vendas' },
      { id: 'vendas.desconto', label: 'Aplicar descontos' },
    ],
  },
  {
    titulo: 'Caixa',
    itens: [
      { id: 'caixa.abrir', label: 'Abrir caixa' },
      { id: 'caixa.fechar', label: 'Fechar caixa' },
      { id: 'caixa.sangria', label: 'Realizar sangria' },
      { id: 'caixa.reforco', label: 'Realizar reforco' },
    ],
  },
  {
    titulo: 'Cadastros',
    itens: [
      { id: 'produtos.visualizar', label: 'Visualizar produtos' },
      { id: 'produtos.editar', label: 'Editar produtos' },
      { id: 'clientes.visualizar', label: 'Visualizar clientes' },
      { id: 'clientes.editar', label: 'Editar clientes' },
    ],
  },
  {
    titulo: 'Financeiro',
    itens: [
      { id: 'financeiro.contas_pagar', label: 'Contas a pagar' },
      { id: 'financeiro.contas_receber', label: 'Contas a receber' },
      { id: 'financeiro.despesas', label: 'Despesas' },
      { id: 'financeiro.fluxo_caixa', label: 'Fluxo de caixa' },
    ],
  },
  {
    titulo: 'Relatorios',
    itens: [
      { id: 'relatorios.visualizar', label: 'Visualizar relatorios' },
      { id: 'relatorios.exportar', label: 'Exportar relatorios' },
    ],
  },
  {
    titulo: 'Configuracoes',
    itens: [
      { id: 'config.empresa', label: 'Dados da empresa' },
      { id: 'config.parametros', label: 'Parametros do sistema' },
    ],
  },
]

function defaultPerms(role: string): Record<string, boolean> {
  const perms: Record<string, boolean> = {}
  PERMISSOES_GRUPOS.forEach(g => g.itens.forEach(i => {
    if (role === 'gerente') {
      perms[i.id] = true
    } else {
      perms[i.id] = i.id.startsWith('vendas.criar') || i.id.startsWith('vendas.visualizar') ||
        i.id.startsWith('caixa.') || i.id.includes('.visualizar')
    }
  }))
  return perms
}

/** Remove acentos de uma string */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Gera dominio a partir do nome da empresa.
 *  Ex: "MR Drones Aplicacoes Agricolas" → "mrdrones"
 *  Remove sufixos como LTDA, ME, EPP, EIRELI, SA, S/A
 */
function gerarDominio(nomeEmpresa: string): string {
  if (!nomeEmpresa) return 'empresa'
  let nome = removeAccents(nomeEmpresa).toLowerCase()
  // Remove sufixos empresariais
  nome = nome.replace(/\b(ltda|me|epp|eireli|s\.?a\.?|s\/a|micro\s*empresa)\b/gi, '')
  // Remove tudo que nao for letra/numero
  nome = nome.replace(/[^a-z0-9]/g, '')
  return nome || 'empresa'
}

/** Gera username a partir do nome da pessoa.
 *  Ex: "Laiane Lima" → "laiane.lima"
 */
function gerarUsername(nomePessoa: string): string {
  if (!nomePessoa.trim()) return ''
  const partes = removeAccents(nomePessoa.trim()).toLowerCase().split(/\s+/).filter(Boolean)
  return partes.join('.')
}

export function UsuariosPage() {
  const { user } = useAuth()
  const { sucesso, erro } = useToast()
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState('caixa')
  const [comissao, setComissao] = useState(0)
  const [perms, setPerms] = useState<Record<string, boolean>>({})
  const [showPerms, setShowPerms] = useState(false)
  const [showSenha, setShowSenha] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Dominio da empresa
  const dominio = useMemo(() => {
    return gerarDominio(user?.empresa?.nome || '')
  }, [user?.empresa?.nome])

  const emailCompleto = useMemo(() => {
    if (!username.trim()) return ''
    return `${username.trim()}@${dominio}.com`
  }, [username, dominio])

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await api.get('/usuarios')
      if (res.success) setUsuarios(res.data || [])
    } catch {
      erro('Erro ao carregar usuarios')
    } finally {
      setLoading(false)
    }
  }, [erro])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  const resetForm = useCallback(() => {
    setShowForm(false)
    setEditingId(null)
    setNome('')
    setUsername('')
    setSenha('')
    setRole('caixa')
    setComissao(0)
    setPerms(defaultPerms('caixa'))
    setShowPerms(false)
    setShowSenha(false)
  }, [])

  const handleNew = useCallback(() => {
    resetForm()
    setPerms(defaultPerms('caixa'))
    setShowForm(true)
  }, [resetForm])

  const handleEdit = useCallback((u: User) => {
    setEditingId(u._id)
    setNome(u.nome)
    // Extrair username do email (parte antes do @)
    const parts = u.email.split('@')
    setUsername(parts[0] || '')
    setSenha('')
    setRole(u.role)
    setComissao(u.comissao || 0)
    setPerms(u.permissoes || defaultPerms(u.role))
    setShowForm(true)
    setShowPerms(false)
    setShowSenha(false)
  }, [])

  // Auto-gerar username quando nome muda (apenas para novo usuario)
  const handleNomeChange = useCallback((novoNome: string) => {
    setNome(novoNome)
    if (!editingId) {
      setUsername(gerarUsername(novoNome))
    }
  }, [editingId])

  const handleRoleChange = useCallback((newRole: string) => {
    setRole(newRole)
    if (!editingId) {
      setPerms(defaultPerms(newRole))
    }
  }, [editingId])

  const handleSave = useCallback(async () => {
    if (!nome.trim()) {
      erro('Nome e obrigatorio')
      return
    }
    if (!username.trim()) {
      erro('Usuario (email) e obrigatorio')
      return
    }
    if (!editingId && !senha) {
      erro('Senha e obrigatoria para novo usuario')
      return
    }

    const email = emailCompleto

    setSaving(true)
    try {
      if (editingId) {
        const payload: Record<string, unknown> = { nome, email, role, permissoes: perms, comissao }
        if (senha) payload.novaSenha = senha
        const res = await api.put(`/usuarios/${editingId}`, payload)
        if (res.success) {
          sucesso('Usuario atualizado!')
          resetForm()
          fetchUsuarios()
        }
      } else {
        const res = await api.post('/usuarios', { nome, email, senha, role, permissoes: perms, comissao })
        if (res.success) {
          sucesso('Usuario criado!')
          resetForm()
          fetchUsuarios()
        }
      }
    } catch (err: any) {
      erro(err.message || 'Erro ao salvar usuario')
    } finally {
      setSaving(false)
    }
  }, [nome, username, emailCompleto, senha, role, comissao, perms, editingId, sucesso, erro, resetForm, fetchUsuarios])

  const handleToggleAtivo = useCallback(async (u: User) => {
    try {
      const res = await api.put(`/usuarios/${u._id}`, { ativo: !u.ativo })
      if (res.success) {
        sucesso(u.ativo ? 'Usuario desativado' : 'Usuario ativado')
        fetchUsuarios()
      }
    } catch (err: any) {
      erro(err.message || 'Erro ao alterar status')
    }
  }, [sucesso, erro, fetchUsuarios])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      const res = await api.delete(`/usuarios/${deleteId}`)
      if (res.success) {
        sucesso('Usuario removido!')
        setDeleteId(null)
        fetchUsuarios()
      }
    } catch (err: any) {
      erro(err.message || 'Erro ao remover usuario')
    }
  }, [deleteId, sucesso, erro, fetchUsuarios])

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center text-gray-500">
        <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Acesso restrito</p>
        <p className="text-sm mt-1">Apenas administradores podem gerenciar usuarios.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Usuarios</h1>
              <p className="text-sm text-text-secondary">Gerencie operadores, gerentes e suas permissoes.</p>
            </div>
          </div>
          <button onClick={handleNew} className="btn-primary">
            <Plus className="h-4 w-4" /> Novo Usuario
          </button>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : usuarios.length === 0 && !showForm ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-card">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">Nenhum usuario cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">Crie operadores e gerentes para sua equipe.</p>
            <button onClick={handleNew} className="btn-primary mt-4">
              <Plus className="h-4 w-4" /> Criar Primeiro Usuario
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {usuarios.map(u => (
              <div key={u._id} className={`rounded-xl border bg-white p-4 shadow-card flex items-center gap-4 ${!u.ativo ? 'opacity-60' : ''}`}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {u.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{u.nome}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <span className={`badge ${u.role === 'gerente' ? 'badge-info' : 'badge-default'} capitalize text-xs`}>
                  {u.role === 'gerente' ? 'Gerente' : 'Caixa'}
                </span>
                <Switch
                  checked={u.ativo}
                  onChange={() => handleToggleAtivo(u)}
                  rightLabel={u.ativo ? 'Ativo' : 'Inativo'}
                />
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(u)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(u._id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-bold text-gray-800">
                  {editingId ? 'Editar Usuario' : 'Novo Usuario'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Nome</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => handleNomeChange(e.target.value)}
                    className="input-field"
                    placeholder="Nome do usuario"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Email de acesso</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      className="input-field rounded-r-none border-r-0 flex-1"
                      placeholder="nome.sobrenome"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-xl border border-l-0 border-gray-300 bg-gray-100 text-sm text-gray-500 font-medium whitespace-nowrap">
                      @{dominio}.com
                    </span>
                  </div>
                  {emailCompleto && (
                    <p className="mt-1 text-xs text-gray-400">Login: <span className="font-medium text-gray-600">{emailCompleto}</span></p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    {editingId ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}
                  </label>
                  <div className="relative">
                    <input
                      type={showSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      className="input-field pr-10"
                      placeholder={editingId ? 'Deixe vazio para manter' : 'Minimo 6 caracteres'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Funcao</label>
                  <select value={role} onChange={e => handleRoleChange(e.target.value)} className="input-field">
                    {PAPEIS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Comissao (%)</label>
                  <input
                    type="number" min={0} max={100} step={0.5}
                    value={comissao} onChange={e => setComissao(Number(e.target.value) || 0)}
                    placeholder="0" className="input-field"
                  />
                  <p className="text-xs text-gray-400 mt-1">Percentual sobre vendas realizadas</p>
                </div>

                {/* Permissions toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPerms(!showPerms)}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {showPerms ? 'Ocultar Permissoes' : 'Configurar Permissoes'}
                  </button>
                </div>

                {showPerms && (
                  <div className="space-y-4 border-t pt-4">
                    {PERMISSOES_GRUPOS.map(grupo => (
                      <div key={grupo.titulo}>
                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{grupo.titulo}</h4>
                        <div className="space-y-2">
                          {grupo.itens.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                              <span className="text-sm text-text-primary">{item.label}</span>
                              <Switch
                                checked={perms[item.id] ?? false}
                                onChange={v => setPerms(prev => ({ ...prev, [item.id]: v }))}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5 border-t flex gap-3">
                <button onClick={resetForm} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                  {saving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Remover Usuario</h3>
              <p className="text-sm text-gray-600 mb-6">
                Tem certeza que deseja remover este usuario? Esta acao nao pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors flex-1">
                  Remover
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
