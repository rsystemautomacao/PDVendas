import { useState, useCallback, useEffect } from 'react'
import { ShieldCheck, Save, X } from 'lucide-react'
import { Switch } from '../../../components/app/Switch'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'

const STORAGE_KEY = 'meupdv_permissoes'

const PAPEIS = [
  { value: 'admin', label: 'Administrador' },
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
      { id: 'caixa.reforco', label: 'Realizar reforço' },
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
    titulo: 'Relatórios',
    itens: [
      { id: 'relatorios.visualizar', label: 'Visualizar relatórios' },
      { id: 'relatorios.exportar', label: 'Exportar relatórios' },
    ],
  },
  {
    titulo: 'Configurações',
    itens: [
      { id: 'config.empresa', label: 'Dados da empresa' },
      { id: 'config.parametros', label: 'Parâmetros do sistema' },
      { id: 'config.permissoes', label: 'Gerenciar permissões' },
    ],
  },
]

function allPermIds(): string[] {
  return PERMISSOES_GRUPOS.flatMap(g => g.itens.map(i => i.id))
}

function loadPerms(papel: string): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const all = JSON.parse(saved)
      if (all[papel]) return all[papel]
    }
  } catch { /* ignore */ }
  // Default: admin tem tudo, demais tem vendas/caixa/cadastros.visualizar
  const o: Record<string, boolean> = {}
  allPermIds().forEach(id => {
    if (papel === 'admin') {
      o[id] = true
    } else if (papel === 'gerente') {
      o[id] = !id.includes('config.permissoes')
    } else {
      o[id] = id.startsWith('vendas.criar') || id.startsWith('vendas.visualizar') || id.startsWith('caixa.') || id.includes('.visualizar')
    }
  })
  return o
}

function savePerms(papel: string, perms: Record<string, boolean>) {
  let all: Record<string, Record<string, boolean>> = {}
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) all = JSON.parse(saved)
  } catch { /* ignore */ }
  all[papel] = perms
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function PermissoesPage() {
  const { user } = useAuth()
  const { sucesso } = useToast()
  const [loading, setLoading] = useState(false)
  const [papel, setPapel] = useState('admin')
  const [perms, setPerms] = useState<Record<string, boolean>>(() => loadPerms('admin'))

  useEffect(() => {
    setPerms(loadPerms(papel))
  }, [papel])

  const setPerm = useCallback((id: string, value: boolean) => {
    setPerms(prev => ({ ...prev, [id]: value }))
  }, [])

  const handleMarcarTodos = useCallback(() => {
    setPerms(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { next[k] = true })
      return next
    })
  }, [])

  const handleDesmarcarTodos = useCallback(() => {
    setPerms(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { next[k] = false })
      return next
    })
  }, [])

  const handleSave = useCallback(() => {
    setLoading(true)
    try {
      savePerms(papel, perms)
      sucesso(`Permissões do perfil "${PAPEIS.find(p => p.value === papel)?.label}" salvas!`)
    } finally {
      setLoading(false)
    }
  }, [papel, perms, sucesso])

  const ativos = Object.values(perms).filter(Boolean).length
  const total = Object.keys(perms).length

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Permissões {user?.nome ? `- ${user.nome}` : ''}
            </h1>
            <p className="text-sm text-text-secondary">Gerencie as permissões por perfil de usuário.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* Seletor de Perfil */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 font-semibold text-text-primary">Perfil de Usuário</h2>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-sm font-medium text-text-primary">Papel</label>
                <select
                  value={papel}
                  onChange={(e) => setPapel(e.target.value)}
                  className="input-field"
                >
                  {PAPEIS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
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
            <p className="mt-3 text-sm text-text-secondary">
              {ativos} de {total} permissões ativas
            </p>
          </div>

          {papel === 'admin' && (
            <div className="rounded-xl border border-primary/30 bg-primary-pale px-4 py-3 text-sm text-text-primary">
              O perfil <strong>Administrador</strong> possui acesso total ao sistema. Algumas permissões não podem ser desabilitadas.
            </div>
          )}

          {/* Grupos de Permissões */}
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
                      onChange={(v) => setPerm(p.id, v)}
                      rightLabel="Sim"
                      leftLabel="Não"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Botões */}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setPerms(loadPerms(papel))} className="btn-secondary">
            <X className="h-4 w-4" /> Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
