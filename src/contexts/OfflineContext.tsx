/**
 * OfflineContext.tsx — Gerencia o modo offline do MeuPDV
 *
 * Responsabilidades:
 * - Detectar online/offline
 * - Sincronizar vendas pendentes quando voltar online
 * - Prover estado para o indicador visual
 *
 * SEGURANCA: Este contexto NUNCA interfere no fluxo online normal.
 * Ele apenas reage a mudancas de conectividade e oferece dados.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import {
  buscarVendasPendentes,
  marcarVendaSincronizada,
  limparVendasSincronizadas,
  contarVendasPendentes,
} from '../utils/offlineDb'

interface OfflineState {
  /** App esta online e servidor acessivel */
  isOnline: boolean
  /** Quantidade de vendas aguardando sync */
  vendasPendentes: number
  /** Sync esta em andamento */
  sincronizando: boolean
  /** Ultima mensagem de sync */
  ultimoSync: string | null
  /** Forca verificacao de conexao */
  verificarConexao: () => void
  /** Forca tentativa de sync */
  tentarSync: () => Promise<void>
  /** Atualiza contador de vendas pendentes */
  atualizarContador: () => Promise<void>
}

const OfflineContext = createContext<OfflineState>({
  isOnline: true,
  vendasPendentes: 0,
  sincronizando: false,
  ultimoSync: null,
  verificarConexao: () => {},
  tentarSync: async () => {},
  atualizarContador: async () => {},
})

export function useOffline() {
  return useContext(OfflineContext)
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, verificar } = useOnlineStatus()
  const [vendasPendentes, setVendasPendentes] = useState(0)
  const [sincronizando, setSincronizando] = useState(false)
  const [ultimoSync, setUltimoSync] = useState<string | null>(null)
  const syncEmAndamento = useRef(false)

  // Atualizar contador de vendas pendentes
  const atualizarContador = useCallback(async () => {
    try {
      const count = await contarVendasPendentes()
      setVendasPendentes(count)
    } catch {
      // IndexedDB pode falhar em contextos raros, ignorar
    }
  }, [])

  // Sincronizar vendas pendentes com o servidor
  const tentarSync = useCallback(async () => {
    if (syncEmAndamento.current || !isOnline) return
    syncEmAndamento.current = true
    setSincronizando(true)

    try {
      const pendentes = await buscarVendasPendentes() as Array<{
        offlineId: number
        payload: Record<string, unknown>
        tentativas: number
      }>

      if (pendentes.length === 0) {
        setSincronizando(false)
        syncEmAndamento.current = false
        return
      }

      const token = localStorage.getItem('meupdv_token')
      const baseUrl = import.meta.env.VITE_API_URL || '/api'

      let sucessos = 0
      let falhas = 0

      for (const venda of pendentes) {
        try {
          const resp = await fetch(`${baseUrl}/vendas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(venda.payload),
          })

          if (resp.ok) {
            await marcarVendaSincronizada(venda.offlineId)
            sucessos++
          } else {
            const data = await resp.json().catch(() => ({}))
            // Se for erro de validacao (400), marcar como sincronizado para nao travar a fila
            if (resp.status === 400) {
              console.warn('[Offline Sync] Venda rejeitada pelo servidor:', data)
              await marcarVendaSincronizada(venda.offlineId)
              sucessos++
            } else {
              falhas++
            }
          }
        } catch {
          falhas++
          // Parar de tentar se servidor ficou inacessivel novamente
          break
        }
      }

      // Limpar vendas ja sincronizadas
      await limparVendasSincronizadas()
      await atualizarContador()

      if (sucessos > 0) {
        setUltimoSync(
          `${sucessos} venda(s) sincronizada(s)${falhas > 0 ? `, ${falhas} com erro` : ''}`,
        )
      }
    } catch (err) {
      console.error('[Offline Sync] Erro:', err)
    } finally {
      setSincronizando(false)
      syncEmAndamento.current = false
    }
  }, [isOnline, atualizarContador])

  // Quando voltar online, tentar sincronizar
  useEffect(() => {
    if (isOnline) {
      tentarSync()
    }
  }, [isOnline, tentarSync])

  // Contar pendentes ao montar
  useEffect(() => {
    atualizarContador()
  }, [atualizarContador])

  // Limpar mensagem de sync apos 10s
  useEffect(() => {
    if (!ultimoSync) return
    const timer = setTimeout(() => setUltimoSync(null), 10_000)
    return () => clearTimeout(timer)
  }, [ultimoSync])

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        vendasPendentes,
        sincronizando,
        ultimoSync,
        verificarConexao: verificar,
        tentarSync,
        atualizarContador,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}
