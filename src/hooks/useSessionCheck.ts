import { useEffect, useRef } from 'react'
import { StorageKeys } from '../utils/storage'

const CHECK_INTERVAL = 30_000 // 30 seconds
const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Polls the server to check if the current session is still valid.
 * If the session was invalidated (kicked, license exceeded, etc.),
 * the API interceptor in api.ts handles redirect + reason storage.
 * This hook simply ensures the check happens periodically even when
 * the user isn't actively making API calls.
 */
export function useSessionCheck() {
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    const token = localStorage.getItem(StorageKeys.TOKEN)
    if (!token) return

    const check = async () => {
      const currentToken = localStorage.getItem(StorageKeys.TOKEN)
      if (!currentToken) {
        if (timerRef.current) clearInterval(timerRef.current)
        return
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        })

        if (res.status === 401) {
          const body = await res.json().catch(() => ({}))
          localStorage.removeItem(StorageKeys.TOKEN)
          localStorage.removeItem(StorageKeys.CURRENT_USER)
          if (body.code === 'SESSION_INVALIDATED' && body.reason) {
            sessionStorage.setItem('meupdv_disconnect_reason', body.reason)
          }
          if (timerRef.current) clearInterval(timerRef.current)
          window.location.href = '/login'
        }
      } catch {
        // Network error — ignore, will retry next interval
      }
    }

    timerRef.current = setInterval(check, CHECK_INTERVAL)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])
}
