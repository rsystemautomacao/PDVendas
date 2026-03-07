import { useState, useCallback, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Info } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { formatDateTime } from '../../utils/helpers'
import type { Notificacao } from '../../types'

const TIPO_CONFIG: Record<string, { cor: string; icon: typeof Bell }> = {
  info: { cor: 'text-blue-600', icon: Info },
  sucesso: { cor: 'text-green-600', icon: Check },
  alerta: { cor: 'text-amber-600', icon: AlertTriangle },
  erro: { cor: 'text-red-600', icon: AlertTriangle },
}

export function NotificacoesPage() {
  const { sucesso: toastSucesso, info: toastInfo } = useToast()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas' | 'lidas'>('todas')

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/notificacoes')
      if (res.success && res.data) {
        setNotificacoes(res.data)
      }
    } catch {
      // silencioso
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const marcarComoLida = useCallback(async (id: string) => {
    try {
      await api.patch(`/notificacoes/${id}/lida`)
      await carregar()
    } catch {
      // silencioso
    }
  }, [carregar])

  const marcarTodasComoLidas = useCallback(async () => {
    try {
      await api.patch('/notificacoes/marcar-todas')
      await carregar()
      toastInfo('Todas as notificações foram marcadas como lidas')
    } catch {
      // silencioso
    }
  }, [carregar, toastInfo])

  const removerNotificacao = useCallback(async (id: string) => {
    try {
      await api.delete(`/notificacoes/${id}`)
      await carregar()
    } catch {
      // silencioso
    }
  }, [carregar])

  const removerTodasLidas = useCallback(async () => {
    try {
      await api.delete('/notificacoes/lidas')
      await carregar()
      toastSucesso('Notificações lidas removidas')
    } catch {
      // silencioso
    }
  }, [carregar, toastSucesso])

  const filtradas = notificacoes.filter(n => {
    if (filtro === 'nao_lidas') return !n.lida
    if (filtro === 'lidas') return n.lida
    return true
  }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())

  const naoLidas = notificacoes.filter(n => !n.lida).length

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Notificações</h1>
              <p className="text-sm text-text-secondary">
                {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Todas lidas'}
              </p>
            </div>
          </div>
          {naoLidas > 0 && (
            <button
              type="button"
              onClick={marcarTodasComoLidas}
              className="btn-ghost text-sm"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(['todas', 'nao_lidas', 'lidas'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filtro === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              {f === 'todas' ? 'Todas' : f === 'nao_lidas' ? 'Não lidas' : 'Lidas'}
              {f === 'nao_lidas' && naoLidas > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {naoLidas}
                </span>
              )}
            </button>
          ))}
          {notificacoes.some(n => n.lida) && (
            <button
              type="button"
              onClick={removerTodasLidas}
              className="ml-auto text-sm text-red-500 hover:text-red-700"
            >
              <Trash2 className="inline h-3.5 w-3.5 mr-1" />
              Limpar lidas
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden">
          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-text-muted" />
              <p className="mt-3 text-text-secondary">Nenhuma notificação{filtro !== 'todas' ? ` ${filtro === 'nao_lidas' ? 'não lida' : 'lida'}` : ''}.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtradas.map(n => {
                const config = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info
                const Icon = config.icon
                return (
                  <li
                    key={n._id}
                    className={`flex items-start gap-4 p-4 transition-colors ${!n.lida ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 ${config.cor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-text-primary ${!n.lida ? 'font-semibold' : 'font-medium'}`}>{n.titulo}</p>
                      <p className="mt-0.5 text-sm text-text-secondary">{n.mensagem}</p>
                      <p className="mt-1 text-xs text-text-muted">{formatDateTime(n.criadoEm)}</p>
                    </div>
                    <div className="flex flex-shrink-0 gap-1">
                      {!n.lida && (
                        <button
                          type="button"
                          onClick={() => marcarComoLida(n._id)}
                          className="rounded p-1.5 text-primary hover:bg-primary/10"
                          title="Marcar como lida"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removerNotificacao(n._id)}
                        className="rounded p-1.5 text-text-muted hover:bg-red-50 hover:text-red-500"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
