/**
 * OfflineIndicator.tsx — Banner visual de modo offline
 *
 * Mostra uma barra no topo quando o app esta offline,
 * e uma notificacao quando vendas pendentes sao sincronizadas.
 */

import { WifiOff, CloudUpload, RefreshCw, CheckCircle } from 'lucide-react'
import { useOffline } from '../../contexts/OfflineContext'

export function OfflineIndicator() {
  const { isOnline, vendasPendentes, sincronizando, ultimoSync } = useOffline()

  // Nada a mostrar se esta online e sem pendencias
  if (isOnline && vendasPendentes === 0 && !ultimoSync) return null

  return (
    <>
      {/* Banner offline */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-md z-50">
          <WifiOff size={16} className="shrink-0" />
          <span>Modo Offline — Vendas serao salvas localmente e sincronizadas ao reconectar</span>
          {vendasPendentes > 0 && (
            <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold ml-1">
              {vendasPendentes} pendente(s)
            </span>
          )}
        </div>
      )}

      {/* Sincronizando */}
      {sincronizando && (
        <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-md z-50">
          <RefreshCw size={16} className="shrink-0 animate-spin" />
          <span>Sincronizando vendas pendentes...</span>
        </div>
      )}

      {/* Vendas pendentes (online mas ainda tem fila) */}
      {isOnline && !sincronizando && vendasPendentes > 0 && (
        <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-md z-50">
          <CloudUpload size={16} className="shrink-0" />
          <span>{vendasPendentes} venda(s) aguardando sincronizacao</span>
        </div>
      )}

      {/* Sync concluido */}
      {ultimoSync && !sincronizando && (
        <div className="bg-green-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-md z-50 animate-pulse">
          <CheckCircle size={16} className="shrink-0" />
          <span>{ultimoSync}</span>
        </div>
      )}
    </>
  )
}
