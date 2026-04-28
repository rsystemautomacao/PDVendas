import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import type { Cliente } from '../types'
import { api } from '../services/api'
import { useToast } from './ToastContext'

interface ClienteContextType {
  clientes: Cliente[]
  loading: boolean
  getCliente: (id: string) => Cliente | undefined
  buscarClientes: (termo: string) => Cliente[]
  adicionarCliente: (c: Omit<Cliente, '_id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Cliente | null>
  atualizarCliente: (id: string, updates: Partial<Cliente>) => Promise<void>
  removerCliente: (id: string) => Promise<void>
  atualizarSaldoDevedor: (id: string, valor: number) => Promise<void>
  recarregar: () => Promise<void>
  carregarSeNecessario: () => Promise<void>
}

const ClienteContext = createContext<ClienteContextType | null>(null)

export function useClientes() {
  const ctx = useContext(ClienteContext)
  if (!ctx) throw new Error('useClientes deve ser usado dentro de ClienteProvider')
  useEffect(() => { ctx.carregarSeNecessario() }, [ctx.carregarSeNecessario])
  return ctx
}

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const jaCarregou = useRef(false)

  const recarregar = useCallback(async () => {
    try {
      const res = await api.get('/clientes?limit=9999')
      if (res.success && res.data) {
        setClientes(res.data)
      }
    } catch {
      // silencioso
    }
  }, [])

  const carregarSeNecessario = useCallback(async () => {
    if (jaCarregou.current) return
    jaCarregou.current = true
    setLoading(true)
    await recarregar()
    setLoading(false)
  }, [recarregar])

  const getCliente = useCallback((id: string) => clientes.find(c => c._id === id), [clientes])

  const buscarClientes = useCallback((termo: string) => {
    const t = termo.toLowerCase()
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(t) ||
      (c.cpfCnpj || '').includes(t) ||
      (c.email || '').toLowerCase().includes(t) ||
      (c.telefone || '').includes(t)
    )
  }, [clientes])

  const adicionarCliente = useCallback(async (c: Omit<Cliente, '_id' | 'criadoEm' | 'atualizadoEm'>) => {
    try {
      const res = await api.post('/clientes', c)
      if (res.success && res.data) {
        await recarregar()
        toast.sucesso(`Cliente "${res.data.nome}" cadastrado com sucesso`)
        return res.data as Cliente
      }
      return null
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao cadastrar cliente')
      return null
    }
  }, [recarregar, toast])

  const atualizarCliente = useCallback(async (id: string, updates: Partial<Cliente>) => {
    try {
      await api.put(`/clientes/${id}`, updates)
      await recarregar()
      toast.sucesso('Cliente atualizado com sucesso')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao atualizar cliente')
    }
  }, [recarregar, toast])

  const removerCliente = useCallback(async (id: string) => {
    try {
      await api.delete(`/clientes/${id}`)
      await recarregar()
      toast.sucesso('Cliente removido')
    } catch (err: any) {
      toast.erro(err.message || 'Erro ao remover cliente')
    }
  }, [recarregar, toast])

  const atualizarSaldoDevedor = useCallback(async (id: string, valor: number) => {
    try {
      await api.patch(`/clientes/${id}/saldo`, { valor })
      await recarregar()
    } catch {
      // silencioso
    }
  }, [recarregar])

  return (
    <ClienteContext.Provider value={{
      clientes, loading, getCliente, buscarClientes,
      adicionarCliente, atualizarCliente, removerCliente, atualizarSaldoDevedor,
      recarregar, carregarSeNecessario,
    }}>
      {children}
    </ClienteContext.Provider>
  )
}
