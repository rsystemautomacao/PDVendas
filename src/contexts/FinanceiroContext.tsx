import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import type { ContaPagar, ContaReceber, Despesa } from '../types'
import { api } from '../services/api'
import { useToast } from './ToastContext'

interface FinanceiroContextType {
  contasPagar: ContaPagar[]
  contasReceber: ContaReceber[]
  despesas: Despesa[]
  // Contas a Pagar
  addContaPagar: (c: Omit<ContaPagar, '_id' | 'criadoEm'>) => Promise<void>
  pagarConta: (id: string) => Promise<void>
  removeContaPagar: (id: string) => Promise<void>
  // Contas a Receber
  addContaReceber: (c: Omit<ContaReceber, '_id' | 'criadoEm'>) => Promise<void>
  receberConta: (id: string) => Promise<void>
  removeContaReceber: (id: string) => Promise<void>
  // Despesas
  addDespesa: (d: Omit<Despesa, '_id' | 'criadoEm'>) => Promise<void>
  updateDespesa: (id: string, updates: Partial<Despesa>) => Promise<void>
  pagarDespesa: (id: string) => Promise<void>
  removeDespesa: (id: string) => Promise<void>
  getDespesa: (id: string) => Despesa | undefined
  // Queries
  getContasPagarPeriodo: (de: string, ate: string) => ContaPagar[]
  getContasReceberPeriodo: (de: string, ate: string) => ContaReceber[]
  getDespesasPeriodo: (de: string, ate: string) => Despesa[]
  getTotalContasPagarPendentes: () => number
  getTotalContasReceberPendentes: () => number
  getContasPagarAtrasadas: () => ContaPagar[]
  getContasReceberAtrasadas: () => ContaReceber[]
  recarregar: () => Promise<void>
  carregarSeNecessario: () => Promise<void>
}

const FinanceiroContext = createContext<FinanceiroContextType | null>(null)

export function useFinanceiro() {
  const ctx = useContext(FinanceiroContext)
  if (!ctx) throw new Error('useFinanceiro deve ser usado dentro de FinanceiroProvider')
  useEffect(() => { ctx.carregarSeNecessario() }, [ctx.carregarSeNecessario])
  return ctx
}

export function FinanceiroProvider({ children }: { children: ReactNode }) {
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([])
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const toast = useToast()
  const jaCarregou = useRef(false)

  const recarregar = useCallback(async () => {
    try {
      const [cpRes, crRes, dRes] = await Promise.all([
        api.get('/financeiro/contas-pagar'),
        api.get('/financeiro/contas-receber'),
        api.get('/financeiro/despesas'),
      ])
      if (cpRes.success && cpRes.data) setContasPagar(cpRes.data)
      if (crRes.success && crRes.data) setContasReceber(crRes.data)
      if (dRes.success && dRes.data) setDespesas(dRes.data)
    } catch {
      // silencioso
    }
    jaCarregou.current = true
  }, [])

  const carregarSeNecessario = useCallback(async () => {
    if (jaCarregou.current) return
    jaCarregou.current = true
    await recarregar()
  }, [recarregar])

  // ---- Contas a Pagar ----
  const addContaPagar = useCallback(async (c: Omit<ContaPagar, '_id' | 'criadoEm'>) => {
    try {
      await api.post('/financeiro/contas-pagar', c)
      await recarregar()
      toast.sucesso('Conta a pagar adicionada')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao adicionar conta')
    }
  }, [recarregar, toast])

  const pagarConta = useCallback(async (id: string) => {
    try {
      await api.put(`/financeiro/contas-pagar/${id}/pagar`)
      await recarregar()
      toast.sucesso('Conta paga com sucesso')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao pagar conta')
    }
  }, [recarregar, toast])

  const removeContaPagar = useCallback(async (id: string) => {
    try {
      await api.delete(`/financeiro/contas-pagar/${id}`)
      await recarregar()
      toast.sucesso('Conta removida')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao remover conta')
    }
  }, [recarregar, toast])

  // ---- Contas a Receber ----
  const addContaReceber = useCallback(async (c: Omit<ContaReceber, '_id' | 'criadoEm'>) => {
    try {
      await api.post('/financeiro/contas-receber', c)
      await recarregar()
      toast.sucesso('Conta a receber adicionada')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao adicionar conta')
    }
  }, [recarregar, toast])

  const receberConta = useCallback(async (id: string) => {
    try {
      await api.put(`/financeiro/contas-receber/${id}/receber`)
      await recarregar()
      toast.sucesso('Recebimento registrado')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao registrar recebimento')
    }
  }, [recarregar, toast])

  const removeContaReceber = useCallback(async (id: string) => {
    try {
      await api.delete(`/financeiro/contas-receber/${id}`)
      await recarregar()
      toast.sucesso('Conta removida')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao remover conta')
    }
  }, [recarregar, toast])

  // ---- Despesas ----
  const addDespesa = useCallback(async (d: Omit<Despesa, '_id' | 'criadoEm'>) => {
    try {
      await api.post('/financeiro/despesas', d)
      await recarregar()
      toast.sucesso('Despesa adicionada')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao adicionar despesa')
    }
  }, [recarregar, toast])

  const updateDespesa = useCallback(async (id: string, updates: Partial<Despesa>) => {
    try {
      await api.put(`/financeiro/despesas/${id}`, updates)
      await recarregar()
      toast.sucesso('Despesa atualizada')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao atualizar despesa')
    }
  }, [recarregar, toast])

  const pagarDespesa = useCallback(async (id: string) => {
    try {
      await api.put(`/financeiro/despesas/${id}/pagar`)
      await recarregar()
      toast.sucesso('Despesa paga')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao pagar despesa')
    }
  }, [recarregar, toast])

  const removeDespesa = useCallback(async (id: string) => {
    try {
      await api.delete(`/financeiro/despesas/${id}`)
      await recarregar()
      toast.sucesso('Despesa removida')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao remover despesa')
    }
  }, [recarregar, toast])

  const getDespesa = useCallback((id: string) => despesas.find(d => d._id === id), [despesas])

  // ---- Queries ----
  const isInRange = (date: string, de: string, ate: string) => {
    const d = date.substring(0, 10)
    return d >= de && d <= ate
  }

  const getContasPagarPeriodo = useCallback((de: string, ate: string) =>
    contasPagar.filter(c => isInRange(c.vencimento, de, ate)), [contasPagar])

  const getContasReceberPeriodo = useCallback((de: string, ate: string) =>
    contasReceber.filter(c => isInRange(c.vencimento, de, ate)), [contasReceber])

  const getDespesasPeriodo = useCallback((de: string, ate: string) =>
    despesas.filter(d => isInRange(d.vencimento, de, ate)), [despesas])

  const getTotalContasPagarPendentes = useCallback(() =>
    contasPagar.filter(c => !c.pago).reduce((s, c) => s + c.valor, 0), [contasPagar])

  const getTotalContasReceberPendentes = useCallback(() =>
    contasReceber.filter(c => !c.recebido).reduce((s, c) => s + c.valor, 0), [contasReceber])

  const getContasPagarAtrasadas = useCallback(() => {
    const hoje = new Date().toISOString().substring(0, 10)
    return contasPagar.filter(c => !c.pago && c.vencimento < hoje)
  }, [contasPagar])

  const getContasReceberAtrasadas = useCallback(() => {
    const hoje = new Date().toISOString().substring(0, 10)
    return contasReceber.filter(c => !c.recebido && c.vencimento < hoje)
  }, [contasReceber])

  return (
    <FinanceiroContext.Provider value={{
      contasPagar, contasReceber, despesas,
      addContaPagar, pagarConta, removeContaPagar,
      addContaReceber, receberConta, removeContaReceber,
      addDespesa, updateDespesa, pagarDespesa, removeDespesa, getDespesa,
      getContasPagarPeriodo, getContasReceberPeriodo, getDespesasPeriodo,
      getTotalContasPagarPendentes, getTotalContasReceberPendentes,
      getContasPagarAtrasadas, getContasReceberAtrasadas,
      recarregar, carregarSeNecessario,
    }}>
      {children}
    </FinanceiroContext.Provider>
  )
}
