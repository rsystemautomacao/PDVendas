import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { ContaPagar, ContaReceber, Despesa } from '../types'
import { StorageKeys, getAll, saveAll, generateId } from '../utils/storage'
import { todayISO, isDateInRange } from '../utils/helpers'
import { useToast } from './ToastContext'

interface FinanceiroContextType {
  contasPagar: ContaPagar[]
  contasReceber: ContaReceber[]
  despesas: Despesa[]
  // Contas a Pagar
  addContaPagar: (c: Omit<ContaPagar, '_id' | 'criadoEm'>) => void
  pagarConta: (id: string) => void
  removeContaPagar: (id: string) => void
  // Contas a Receber
  addContaReceber: (c: Omit<ContaReceber, '_id' | 'criadoEm'>) => void
  receberConta: (id: string) => void
  removeContaReceber: (id: string) => void
  // Despesas
  addDespesa: (d: Omit<Despesa, '_id' | 'criadoEm'>) => void
  updateDespesa: (id: string, updates: Partial<Despesa>) => void
  pagarDespesa: (id: string) => void
  removeDespesa: (id: string) => void
  getDespesa: (id: string) => Despesa | undefined
  // Queries
  getContasPagarPeriodo: (de: string, ate: string) => ContaPagar[]
  getContasReceberPeriodo: (de: string, ate: string) => ContaReceber[]
  getDespesasPeriodo: (de: string, ate: string) => Despesa[]
  getTotalContasPagarPendentes: () => number
  getTotalContasReceberPendentes: () => number
  getContasPagarAtrasadas: () => ContaPagar[]
  getContasReceberAtrasadas: () => ContaReceber[]
}

const FinanceiroContext = createContext<FinanceiroContextType | null>(null)

export function useFinanceiro() {
  const ctx = useContext(FinanceiroContext)
  if (!ctx) throw new Error('useFinanceiro deve ser usado dentro de FinanceiroProvider')
  return ctx
}

function seedFinanceiro() {
  const cp = getAll<ContaPagar>(StorageKeys.CONTAS_PAGAR)
  if (cp.length === 0) {
    const now = todayISO()
    const seed: ContaPagar[] = [
      { _id: generateId(), descricao: 'Aluguel do mes', fornecedor: 'Imobiliaria ABC', valor: 2500, valorPago: 0, vencimento: '2026-02-28', pago: false, categoria: 'Aluguel', criadoEm: now },
      { _id: generateId(), descricao: 'Conta de luz', fornecedor: 'CPFL', valor: 450, valorPago: 0, vencimento: '2026-02-20', pago: false, categoria: 'Utilidades', criadoEm: now },
      { _id: generateId(), descricao: 'Fornecedor de bebidas', fornecedor: 'Distribuidora XYZ', valor: 1800, valorPago: 1800, vencimento: '2026-02-10', pago: true, pagoEm: '2026-02-10', categoria: 'Fornecedores', criadoEm: now },
    ]
    saveAll(StorageKeys.CONTAS_PAGAR, seed)
  }

  const cr = getAll<ContaReceber>(StorageKeys.CONTAS_RECEBER)
  if (cr.length === 0) {
    const now = todayISO()
    const seed: ContaReceber[] = [
      { _id: generateId(), descricao: 'Venda a prazo - Maria Santos', clienteNome: 'Maria Santos', valor: 150, valorRecebido: 0, vencimento: '2026-02-25', recebido: false, criadoEm: now },
      { _id: generateId(), descricao: 'Venda a prazo - Ana Costa', clienteNome: 'Ana Costa', valor: 200, valorRecebido: 0, vencimento: '2026-02-28', recebido: false, criadoEm: now },
    ]
    saveAll(StorageKeys.CONTAS_RECEBER, seed)
  }

  const desp = getAll<Despesa>(StorageKeys.DESPESAS)
  if (desp.length === 0) {
    const now = todayISO()
    const seed: Despesa[] = [
      { _id: generateId(), nome: 'Aluguel', fornecedor: 'Imobiliaria ABC', tipo: 'fixa', valor: 2500, vencimento: '2026-02-28', pago: false, criadoEm: now },
      { _id: generateId(), nome: 'Internet', fornecedor: 'Vivo', tipo: 'fixa', valor: 180, vencimento: '2026-02-15', pago: true, pagoEm: '2026-02-15', criadoEm: now },
      { _id: generateId(), nome: 'Material de limpeza', tipo: 'variavel', valor: 120, vencimento: '2026-02-20', pago: false, criadoEm: now },
    ]
    saveAll(StorageKeys.DESPESAS, seed)
  }
}

export function FinanceiroProvider({ children }: { children: ReactNode }) {
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([])
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const toast = useToast()

  const reload = useCallback(() => {
    setContasPagar(getAll<ContaPagar>(StorageKeys.CONTAS_PAGAR))
    setContasReceber(getAll<ContaReceber>(StorageKeys.CONTAS_RECEBER))
    setDespesas(getAll<Despesa>(StorageKeys.DESPESAS))
  }, [])

  useEffect(() => {
    seedFinanceiro()
    reload()
  }, [reload])

  // ---- Contas a Pagar ----
  const addContaPagar = useCallback((c: Omit<ContaPagar, '_id' | 'criadoEm'>) => {
    const all = getAll<ContaPagar>(StorageKeys.CONTAS_PAGAR)
    all.push({ ...c, _id: generateId(), criadoEm: todayISO() })
    saveAll(StorageKeys.CONTAS_PAGAR, all)
    reload()
    toast.sucesso('Conta a pagar adicionada')
  }, [reload, toast])

  const pagarConta = useCallback((id: string) => {
    const all = getAll<ContaPagar>(StorageKeys.CONTAS_PAGAR)
    const idx = all.findIndex(c => c._id === id)
    if (idx === -1) return
    all[idx].pago = true
    all[idx].valorPago = all[idx].valor
    all[idx].pagoEm = todayISO()
    saveAll(StorageKeys.CONTAS_PAGAR, all)
    reload()
    toast.sucesso('Conta paga com sucesso')
  }, [reload, toast])

  const removeContaPagar = useCallback((id: string) => {
    saveAll(StorageKeys.CONTAS_PAGAR, getAll<ContaPagar>(StorageKeys.CONTAS_PAGAR).filter(c => c._id !== id))
    reload()
    toast.sucesso('Conta removida')
  }, [reload, toast])

  // ---- Contas a Receber ----
  const addContaReceber = useCallback((c: Omit<ContaReceber, '_id' | 'criadoEm'>) => {
    const all = getAll<ContaReceber>(StorageKeys.CONTAS_RECEBER)
    all.push({ ...c, _id: generateId(), criadoEm: todayISO() })
    saveAll(StorageKeys.CONTAS_RECEBER, all)
    reload()
    toast.sucesso('Conta a receber adicionada')
  }, [reload, toast])

  const receberConta = useCallback((id: string) => {
    const all = getAll<ContaReceber>(StorageKeys.CONTAS_RECEBER)
    const idx = all.findIndex(c => c._id === id)
    if (idx === -1) return
    all[idx].recebido = true
    all[idx].valorRecebido = all[idx].valor
    all[idx].recebidoEm = todayISO()
    saveAll(StorageKeys.CONTAS_RECEBER, all)
    reload()
    toast.sucesso('Recebimento registrado')
  }, [reload, toast])

  const removeContaReceber = useCallback((id: string) => {
    saveAll(StorageKeys.CONTAS_RECEBER, getAll<ContaReceber>(StorageKeys.CONTAS_RECEBER).filter(c => c._id !== id))
    reload()
    toast.sucesso('Conta removida')
  }, [reload, toast])

  // ---- Despesas ----
  const addDespesa = useCallback((d: Omit<Despesa, '_id' | 'criadoEm'>) => {
    const all = getAll<Despesa>(StorageKeys.DESPESAS)
    all.push({ ...d, _id: generateId(), criadoEm: todayISO() })
    saveAll(StorageKeys.DESPESAS, all)
    reload()
    toast.sucesso('Despesa adicionada')
  }, [reload, toast])

  const updateDespesa = useCallback((id: string, updates: Partial<Despesa>) => {
    const all = getAll<Despesa>(StorageKeys.DESPESAS)
    const idx = all.findIndex(d => d._id === id)
    if (idx === -1) return
    all[idx] = { ...all[idx], ...updates }
    saveAll(StorageKeys.DESPESAS, all)
    reload()
    toast.sucesso('Despesa atualizada')
  }, [reload, toast])

  const pagarDespesa = useCallback((id: string) => {
    const all = getAll<Despesa>(StorageKeys.DESPESAS)
    const idx = all.findIndex(d => d._id === id)
    if (idx === -1) return
    all[idx].pago = true
    all[idx].pagoEm = todayISO()
    saveAll(StorageKeys.DESPESAS, all)
    reload()
    toast.sucesso('Despesa paga')
  }, [reload, toast])

  const removeDespesa = useCallback((id: string) => {
    saveAll(StorageKeys.DESPESAS, getAll<Despesa>(StorageKeys.DESPESAS).filter(d => d._id !== id))
    reload()
    toast.sucesso('Despesa removida')
  }, [reload, toast])

  const getDespesa = useCallback((id: string) => despesas.find(d => d._id === id), [despesas])

  // ---- Queries ----
  const getContasPagarPeriodo = useCallback((de: string, ate: string) =>
    contasPagar.filter(c => isDateInRange(c.vencimento, de, ate)), [contasPagar])

  const getContasReceberPeriodo = useCallback((de: string, ate: string) =>
    contasReceber.filter(c => isDateInRange(c.vencimento, de, ate)), [contasReceber])

  const getDespesasPeriodo = useCallback((de: string, ate: string) =>
    despesas.filter(d => isDateInRange(d.vencimento, de, ate)), [despesas])

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
    }}>
      {children}
    </FinanceiroContext.Provider>
  )
}
