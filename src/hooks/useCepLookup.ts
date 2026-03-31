import { useState, useCallback } from 'react'

interface CepResult {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  complemento: string
  erro?: boolean
}

interface CepCallbacks {
  onLogradouro?: (v: string) => void
  onBairro?: (v: string) => void
  onCidade?: (v: string) => void
  onEstado?: (v: string) => void
  onComplemento?: (v: string) => void
}

export function useCepLookup(callbacks: CepCallbacks) {
  const [loading, setLoading] = useState(false)

  const buscarCep = useCallback(async (cepRaw: string) => {
    const cep = cepRaw.replace(/\D/g, '')
    if (cep.length !== 8) return

    setLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data: CepResult = await res.json()

      if (!data.erro) {
        if (data.logradouro) callbacks.onLogradouro?.(data.logradouro)
        if (data.bairro) callbacks.onBairro?.(data.bairro)
        if (data.localidade) callbacks.onCidade?.(data.localidade)
        if (data.uf) callbacks.onEstado?.(data.uf)
        if (data.complemento) callbacks.onComplemento?.(data.complemento)
      }
    } catch {
      // silencioso - CEP invalido ou sem internet
    } finally {
      setLoading(false)
    }
  }, [callbacks])

  return { buscarCep, loading }
}
