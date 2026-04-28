import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import type { OrdemServico, Orcamento } from '../types'
import { api } from '../services/api'
import { useToast } from './ToastContext'

interface OrdemServicoContextType {
  ordensServico: OrdemServico[]
  orcamentos: Orcamento[]
  loading: boolean
  // OS CRUD
  criarOS: (data: Partial<OrdemServico>) => Promise<OrdemServico | null>
  atualizarOS: (id: string, data: Partial<OrdemServico>) => Promise<OrdemServico | null>
  cancelarOS: (id: string, motivo: string) => Promise<void>
  getOS: (id: string) => OrdemServico | undefined
  // Orçamento CRUD
  criarOrcamento: (data: Partial<Orcamento>) => Promise<Orcamento | null>
  atualizarOrcamento: (id: string, data: Partial<Orcamento>) => Promise<Orcamento | null>
  converterOrcamentoEmOS: (id: string) => Promise<OrdemServico | null>
  getOrcamento: (id: string) => Orcamento | undefined
  // Queries
  getOSAbertas: () => OrdemServico[]
  getOSEmExecucao: () => OrdemServico[]
  getOSConcluidasHoje: () => OrdemServico[]
  getOrcamentosPendentes: () => Orcamento[]
  // Refresh
  recarregar: () => Promise<void>
  carregarSeNecessario: () => Promise<void>
}

const OrdemServicoContext = createContext<OrdemServicoContextType | null>(null)

export function useOrdensServico() {
  const ctx = useContext(OrdemServicoContext)
  if (!ctx) throw new Error('useOrdensServico deve ser usado dentro de OrdemServicoProvider')
  useEffect(() => { ctx.carregarSeNecessario() }, [ctx.carregarSeNecessario])
  return ctx
}

export function OrdemServicoProvider({ children }: { children: ReactNode }) {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const jaCarregou = useRef(false)

  const recarregar = useCallback(async () => {
    try {
      const [resOS, resOrc] = await Promise.all([
        api.get('/ordens-servico?limit=9999'),
        api.get('/orcamentos?limit=9999'),
      ])
      if (resOS.success && resOS.data) setOrdensServico(resOS.data)
      if (resOrc.success && resOrc.data) setOrcamentos(resOrc.data)
    } catch {
      // silencioso
    }
    jaCarregou.current = true
  }, [])

  const carregarSeNecessario = useCallback(async () => {
    if (jaCarregou.current) return
    jaCarregou.current = true
    setLoading(true)
    await recarregar()
    setLoading(false)
  }, [recarregar])

  // ---- OS CRUD ----
  const criarOS = useCallback(async (data: Partial<OrdemServico>) => {
    try {
      const res = await api.post('/ordens-servico', data)
      if (res.success && res.data) {
        const os = res.data as OrdemServico
        await recarregar()
        toast.sucesso(`OS #${os.numero} criada com sucesso!`)
        return os
      }
      return null
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao criar OS')
      return null
    }
  }, [recarregar, toast])

  const atualizarOS = useCallback(async (id: string, data: Partial<OrdemServico>) => {
    try {
      const res = await api.put(`/ordens-servico/${id}`, data)
      if (res.success && res.data) {
        const os = res.data as OrdemServico
        await recarregar()
        toast.sucesso(`OS #${os.numero} atualizada!`)
        return os
      }
      return null
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao atualizar OS')
      return null
    }
  }, [recarregar, toast])

  const cancelarOS = useCallback(async (id: string, motivo: string) => {
    try {
      await api.put(`/ordens-servico/${id}/cancelar`, { motivo })
      await recarregar()
      toast.info('OS cancelada')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao cancelar OS')
    }
  }, [recarregar, toast])

  const getOS = useCallback((id: string) => ordensServico.find(os => os._id === id), [ordensServico])

  // ---- Orçamento CRUD ----
  const criarOrcamento = useCallback(async (data: Partial<Orcamento>) => {
    try {
      const res = await api.post('/orcamentos', data)
      if (res.success && res.data) {
        const orc = res.data as Orcamento
        await recarregar()
        toast.sucesso(`Orçamento #${orc.numero} criado com sucesso!`)
        return orc
      }
      return null
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao criar orçamento')
      return null
    }
  }, [recarregar, toast])

  const atualizarOrcamento = useCallback(async (id: string, data: Partial<Orcamento>) => {
    try {
      const res = await api.put(`/orcamentos/${id}`, data)
      if (res.success && res.data) {
        const orc = res.data as Orcamento
        await recarregar()
        toast.sucesso(`Orçamento #${orc.numero} atualizado!`)
        return orc
      }
      return null
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao atualizar orçamento')
      return null
    }
  }, [recarregar, toast])

  const converterOrcamentoEmOS = useCallback(async (id: string) => {
    try {
      const res = await api.post(`/orcamentos/${id}/converter-os`)
      if (res.success && res.data) {
        const os = res.data as OrdemServico
        await recarregar()
        toast.sucesso(`Orçamento convertido em OS #${os.numero}!`)
        return os
      }
      return null
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao converter orçamento')
      return null
    }
  }, [recarregar, toast])

  const getOrcamento = useCallback((id: string) => orcamentos.find(o => o._id === id), [orcamentos])

  // ---- Queries ----
  const getOSAbertas = useCallback(() =>
    ordensServico.filter(os => ['aberta', 'em_analise', 'orcamento_enviado', 'aprovada'].includes(os.status)),
    [ordensServico]
  )

  const getOSEmExecucao = useCallback(() =>
    ordensServico.filter(os => os.status === 'em_execucao'),
    [ordensServico]
  )

  const getOSConcluidasHoje = useCallback(() => {
    const hoje = new Date().toISOString().substring(0, 10)
    return ordensServico.filter(os =>
      os.status === 'concluida' && os.concluidaEm?.substring(0, 10) === hoje
    )
  }, [ordensServico])

  const getOrcamentosPendentes = useCallback(() =>
    orcamentos.filter(o => ['pendente', 'enviado'].includes(o.status)),
    [orcamentos]
  )

  return (
    <OrdemServicoContext.Provider value={{
      ordensServico, orcamentos, loading,
      criarOS, atualizarOS, cancelarOS, getOS,
      criarOrcamento, atualizarOrcamento, converterOrcamentoEmOS, getOrcamento,
      getOSAbertas, getOSEmExecucao, getOSConcluidasHoje, getOrcamentosPendentes,
      recarregar, carregarSeNecessario,
    }}>
      {children}
    </OrdemServicoContext.Provider>
  )
}
