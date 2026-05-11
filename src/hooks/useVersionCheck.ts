import { useState, useEffect, useRef } from 'react'
import { clearAllCaches } from '../utils/cacheUtils'

const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutes
const STORAGE_KEY = 'meupdv_app_build_time'

async function fetchBuildTime(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.buildTime ?? null
  } catch {
    return null
  }
}

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const pendingVersionRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const check = async (isMount: boolean) => {
      const fetched = await fetchBuildTime()
      if (!fetched || cancelled) return

      const stored = localStorage.getItem(STORAGE_KEY)

      if (!stored) {
        // First visit — just store current version, no banner
        localStorage.setItem(STORAGE_KEY, fetched)
        return
      }

      if (fetched !== stored) {
        pendingVersionRef.current = fetched
        if (!cancelled) setHasUpdate(true)
      } else if (isMount) {
        // Same version on mount — update stored to confirm freshness
        localStorage.setItem(STORAGE_KEY, fetched)
      }
    }

    check(true)
    const timer = setInterval(() => check(false), POLL_INTERVAL)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const doUpdate = async () => {
    // Store new version before reload so banner doesn't re-appear
    if (pendingVersionRef.current) {
      localStorage.setItem(STORAGE_KEY, pendingVersionRef.current)
    }
    await clearAllCaches()
    window.location.reload()
  }

  return { hasUpdate, doUpdate }
}
