import { useEffect, useRef } from 'react'

const CHECK_INTERVAL = 30_000 // 30 seconds
const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Polls the server to check if the current session is still valid.
 * O token JWT está no cookie httpOnly e é enviado automaticamente pelo browser.
 * Se a sessão foi invalidada (licença excedida, logout forçado, etc.),
 * o interceptor em api.ts trata o redirect + armazenamento do motivo.
 */
export function useSessionCheck() {
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    // Só iniciar polling se o usuário parecer estar logado (dados em cache)
    const hasUser = !!localStorage.getItem('meupdv_current_user')
    if (!hasUser) return

    const check = async () => {
      // Se o cache de usuário foi removido (logout), parar o polling
      if (!localStorage.getItem('meupdv_current_user')) {
        if (timerRef.current) clearInterval(timerRef.current)
        return
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          // credentials: 'include' envia o cookie httpOnly automaticamente
          credentials: 'include',
        })

        if (res.status === 401) {
          const body = await res.json().catch(() => ({}))
          localStorage.removeItem('meupdv_current_user')
          if (body.code === 'SESSION_INVALIDATED' && body.reason) {
            sessionStorage.setItem('meupdv_disconnect_reason', body.reason)
          }
          if (timerRef.current) clearInterval(timerRef.current)
          window.location.href = '/login'
        }
      } catch {
        // Erro de rede — ignora, tenta no próximo intervalo
      }
    }

    timerRef.current = setInterval(check, CHECK_INTERVAL)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])
}
