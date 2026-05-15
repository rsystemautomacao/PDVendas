import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import type { Caixa, MovimentacaoCaixa, ContagemForma } from '../types'
import { api } from '../services/api'
import { useToast } from './ToastContext'
import { useAuth } from './AuthContext'

interface CaixaContextType {
  caixas: Caixa[]
  caixaAberto: Caixa | null
  loading: boolean
  abrirCaixa: (valorAbertura: number, observacoes?: string) => Promise<Caixa | null>
  fecharCaixa: (id: string, observacoes?: string, conferencia?: { valorContado?: number; contagemPorForma?: ContagemForma[] }) => Promise<void>
  registrarMovimentacao: (caixaId: string, mov: Omit<MovimentacaoCaixa, '_id' | 'criadoEm'>) => Promise<void>
  getCaixaById: (id: string) => Caixa | undefined
  getCaixasFechados: () => Caixa[]
  recarregar: () => Promise<void>
}

const CaixaContext = createContext<CaixaContextType | null>(null)

export function useCaixa() {
  const ctx = useContext(CaixaContext)
  if (!ctx) throw new Error('useCaixa deve ser usado dentro de CaixaProvider')
  return ctx
}

export function CaixaProvider({ children }: { children: ReactNode }) {
  const [caixas, setCaixas] = useState<Caixa[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { user } = useAuth()

  const recarregar = useCallback(async () => {
    try {
      const res = await api.get('/caixas')
      if (res.success && res.data) {
        setCaixas(res.data)
        // OFFLINE: cachear caixas no localStorage para uso offline
        try {
          localStorage.setItem('meupdv_caixas_cache', JSON.stringify(res.data))
        } catch { /* storage cheio, ignorar */ }
      }
    } catch {
      // OFFLINE: tentar carregar do cache se a API falhou
      try {
        const cached = localStorage.getItem('meupdv_caixas_cache')
        if (cached) {
          setCaixas(JSON.parse(cached))
          return
        }
      } catch { /* ignorar */ }
    }
  }, [])

  useEffect(() => {
    recarregar().finally(() => setLoading(false))
  }, [recarregar])

  // Multi-PDV: cada operador ve apenas o proprio caixa aberto. Varios caixas
  // podem coexistir abertos na mesma empresa (um por operador). Se nao houver
  // user logado ainda, cai no comportamento antigo (qualquer caixa aberto).
  const caixaAberto = useMemo(() => {
    const abertos = caixas.filter(c => c.status === 'aberto')
    if (!user) return abertos[0] || null
    return abertos.find(c => c.operadorId === user._id) || null
  }, [caixas, user])

  const abrirCaixa = useCallback(async (valorAbertura: number, observacoes?: string) => {
    try {
      const res = await api.post('/caixas/abrir', { valorAbertura, observacoes })
      if (res.success && res.data) {
        await recarregar()
        toast.sucesso(`Caixa #${res.data.numero} aberto com sucesso`)
        return res.data as Caixa
      }
      return null
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao abrir caixa')
      return null
    }
  }, [recarregar, toast])

  const fecharCaixa = useCallback(async (
    id: string,
    observacoes?: string,
    conferencia?: { valorContado?: number; contagemPorForma?: ContagemForma[] },
  ) => {
    try {
      await api.put(`/caixas/${id}/fechar`, {
        observacoes,
        valorContado: conferencia?.valorContado,
        contagemPorForma: conferencia?.contagemPorForma,
      })
      await recarregar()
      toast.sucesso('Caixa fechado com sucesso')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao fechar caixa')
    }
  }, [recarregar, toast])

  const registrarMovimentacao = useCallback(async (caixaId: string, mov: Omit<MovimentacaoCaixa, '_id' | 'criadoEm'>) => {
    try {
      await api.post(`/caixas/${caixaId}/movimentacoes`, mov)
      await recarregar()
      toast.sucesso(mov.tipo === 'reforco' ? 'Reforco registrado' : 'Sangria registrada')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao registrar movimentacao')
    }
  }, [recarregar, toast])

  const getCaixaById = useCallback((id: string) => caixas.find(c => c._id === id), [caixas])

  const getCaixasFechados = useCallback(() => caixas.filter(c => c.status === 'fechado'), [caixas])

  return (
    <CaixaContext.Provider value={{
      caixas, caixaAberto, loading, abrirCaixa, fecharCaixa,
      registrarMovimentacao, getCaixaById, getCaixasFechados, recarregar,
    }}>
      {children}
    </CaixaContext.Provider>
  )
}
