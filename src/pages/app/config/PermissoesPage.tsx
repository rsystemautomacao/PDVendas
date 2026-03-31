import { useState, useCallback, useEffect } from 'react'
import { ShieldCheck, Save, X } from 'lucide-react'
import { Switch } from '../../../components/app/Switch'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { api } from '../../../services/api'
import type { User } from '../../../types'

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

export function PermissoesPage() {
  const { user } = useAuth()
  const { sucesso, erro } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [perms, setPerms] = useState<Record<string, boolean>>({})

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await api.get('/usuarios')
      if (res.success) {
        setUsuarios(res.data || [])
        if (res.data?.length > 0 && !selectedUserId) {
          setSelectedUserId(res.data[0]._id)
          setPerms(res.data[0].permissoes || {})
        }
      }
    } catch {
      // Not an admin or no sub-users
    } finally {
      setLoading(false)
    }
  }, [selectedUserId])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  const handleSelectUser = useCallback((userId: string) => {
    setSelectedUserId(userId)
    const u = usuarios.find(u => u._id === userId)
    setPerms(u?.permissoes || {})
  }, [usuarios])

  const handleMarcarTodos = useCallback(() => {
    setPerms(prev => {
      const next = { ...prev }
      PERMISSOES_GRUPOS.forEach(g => g.itens.forEach(i => { next[i.id] = true }))
      return next
    })
  }, [])

  const handleDesmarcarTodos = useCallback(() => {
    setPerms(prev => {
      const next = { ...prev }
      PERMISSOES_GRUPOS.forEach(g => g.itens.forEach(i => { next[i.id] = false }))
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!selectedUserId) return
    setSaving(true)
    try {
      const res = await api.put(`/usuarios/${selectedUserId}`, { permissoes: perms })
      if (res.success) {
        sucesso('Permissoes salvas!')
        fetchUsuarios()
      }
    } catch (err: any) {
      erro(err.message || 'Erro ao salvar permissoes')
    } finally {
      setSaving(false)
    }
  }, [selectedUserId, perms, sucesso, erro, fetchUsuarios])

  const selectedUser = usuarios.find(u => u._id === selectedUserId)
  const ativos = Object.values(perms).filter(Boolean).length
  const total = PERMISSOES_GRUPOS.reduce((s, g) => s + g.itens.length, 0)

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center text-gray-500">
        <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Acesso restrito</p>
        <p className="text-sm mt-1">Apenas administradores podem gerenciar permissoes.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Permissoes</h1>
            <p className="text-sm text-text-secondary">Gerencie as permissoes de cada usuario.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-12 text-center shadow-card">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">Nenhum usuario cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">Crie usuarios em Configuracoes &gt; Usuarios para gerenciar permissoes.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* User Selector */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h2 className="mb-4 font-semibold text-text-primary">Selecionar Usuario</h2>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={selectedUserId || ''}
                    onChange={(e) => handleSelectUser(e.target.value)}
                    className="input-field"
                  >
                    {usuarios.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.nome} ({u.role === 'gerente' ? 'Gerente' : 'Caixa'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleMarcarTodos} className="text-sm font-medium text-primary hover:underline">
                    Marcar todos
                  </button>
                  <span className="text-text-muted">|</span>
                  <button type="button" onClick={handleDesmarcarTodos} className="text-sm font-medium text-amber-600 hover:underline">
                    Desmarcar todos
                  </button>
                </div>
              </div>
              {selectedUser && (
                <p className="mt-3 text-sm text-text-secondary">
                  {ativos} de {total} permissoes ativas para <strong>{selectedUser.nome}</strong>
                </p>
              )}
            </div>

            {/* Permission Groups */}
            {PERMISSOES_GRUPOS.map(grupo => (
              <div key={grupo.titulo} className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
                <h3 className="mb-4 font-semibold text-text-primary">{grupo.titulo}</h3>
                <ul className="space-y-3">
                  {grupo.itens.map(p => (
                    <li key={p.id} className="flex items-center justify-between">
                      <span className="text-sm text-text-primary">{p.label}</span>
                      <Switch
                        id={p.id}
                        checked={perms[p.id] ?? false}
                        onChange={(v) => setPerms(prev => ({ ...prev, [p.id]: v }))}
                        rightLabel="Sim"
                        leftLabel="Nao"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Save */}
        {usuarios.length > 0 && (
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => { if (selectedUser) setPerms(selectedUser.permissoes || {}) }} className="btn-secondary">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
