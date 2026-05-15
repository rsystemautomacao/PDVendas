/**
 * useOnlineStatus.ts — Hook para detectar se o app esta online ou offline.
 *
 * Usa navigator.onLine + eventos online/offline do browser.
 * Tambem faz um ping real ao servidor a cada 30s para confirmar,
 * pois navigator.onLine pode dizer "online" mas o servidor estar inacessivel.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const PING_INTERVAL = 30_000 // 30s
const PING_TIMEOUT = 5_000 // 5s

/** Testa conexao real com o servidor */
async function pingServidor(): Promise<boolean> {
  try {
    // /health esta na raiz do Express, nao em /api/health
    // API_BASE = '/api' (dev) ou 'https://api.omeupdv.com.br/api' (prod)
    // Precisamos remover o /api do final para chegar na raiz
    const apiBase = import.meta.env.VITE_API_URL || '/api'
    const healthUrl = apiBase.replace(/\/api\/?$/, '') + '/health'

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PING_TIMEOUT)

    const resp = await fetch(healthUrl, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timer)
    // Qualquer resposta = servidor acessivel
    return resp.status > 0
  } catch {
    return false
  }
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [servidorAcessivel, setServidorAcessivel] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const verificar = useCallback(async () => {
    const browserOnline = navigator.onLine
    if (!browserOnline) {
      setOnline(false)
      setServidorAcessivel(false)
      return
    }

    setOnline(true)
    const acessivel = await pingServidor()
    setServidorAcessivel(acessivel)
  }, [])

  useEffect(() => {
    // Verificar ao montar
    verificar()

    const handleOnline = () => {
      setOnline(true)
      verificar() // Confirma com ping real
    }

    const handleOffline = () => {
      setOnline(false)
      setServidorAcessivel(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Ping periodico
    intervalRef.current = setInterval(verificar, PING_INTERVAL)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [verificar])

  /** O app esta funcional (online + servidor acessivel)? */
  const isOnline = online && servidorAcessivel

  return {
    /** true se browser reporta online E servidor responde */
    isOnline,
    /** true se browser reporta online (mas servidor pode estar fora) */
    browserOnline: online,
    /** true se ultimo ping ao servidor teve sucesso */
    servidorAcessivel,
    /** Forca uma nova verificacao */
    verificar,
  }
}
