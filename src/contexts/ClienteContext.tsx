import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Cliente } from '../types'
import { StorageKeys, getAll, saveAll, generateId } from '../utils/storage'
import { sanitize, todayISO } from '../utils/helpers'
import { useToast } from './ToastContext'

interface ClienteContextType {
  clientes: Cliente[]
  loading: boolean
  getCliente: (id: string) => Cliente | undefined
  buscarClientes: (termo: string) => Cliente[]
  adicionarCliente: (c: Omit<Cliente, '_id' | 'criadoEm' | 'atualizadoEm'>) => Cliente
  atualizarCliente: (id: string, updates: Partial<Cliente>) => void
  removerCliente: (id: string) => void
  atualizarSaldoDevedor: (id: string, valor: number) => void
}

const ClienteContext = createContext<ClienteContextType | null>(null)

export function useClientes() {
  const ctx = useContext(ClienteContext)
  if (!ctx) throw new Error('useClientes deve ser usado dentro de ClienteProvider')
  return ctx
}

function seedClientes() {
  const existing = getAll<Cliente>(StorageKeys.CLIENTES)
  if (existing.length > 0) return
  const now = todayISO()
  const seed: Cliente[] = [
    { _id: generateId(), tipo: 'fisica', nome: 'Joao Silva', email: 'joao@email.com', telefone: '(11) 98765-4321', celular: '(11) 98765-4321', cpfCnpj: '123.456.789-00', dataNascimento: '1990-05-15', genero: 'masculino', endereco: { logradouro: 'Rua das Flores', numero: '100', bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP', cep: '01000-000' }, limiteCredito: 1000, saldoDevedor: 0, ativo: true, aprovado: true, observacoes: '', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), tipo: 'fisica', nome: 'Maria Santos', email: 'maria@email.com', telefone: '(21) 99876-5432', celular: '', cpfCnpj: '987.654.321-00', dataNascimento: '1985-10-20', genero: 'feminino', endereco: { logradouro: 'Av. Brasil', numero: '500', bairro: 'Copacabana', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '22000-000' }, limiteCredito: 2000, saldoDevedor: 150, ativo: true, aprovado: true, observacoes: 'Cliente frequente', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), tipo: 'juridica', nome: 'Empresa ABC Ltda', email: 'contato@abc.com', telefone: '(11) 3333-4444', cpfCnpj: '12.345.678/0001-90', endereco: { logradouro: 'Rua Industrial', numero: '1000', bairro: 'Distrito Industrial', cidade: 'Sao Paulo', estado: 'SP', cep: '02000-000' }, limiteCredito: 5000, saldoDevedor: 0, ativo: true, aprovado: true, observacoes: 'Empresa parceira', criadoEm: now, atualizadoEm: now },
    { _id: generateId(), tipo: 'fisica', nome: 'Pedro Oliveira', email: 'pedro@email.com', celular: '(31) 99111-2222', cpfCnpj: '111.222.333-44', dataNascimento: '1995-03-08', genero: 'masculino', limiteCredito: 500, saldoDevedor: 0, ativo: true, aprovado: true, criadoEm: now, atualizadoEm: now },
    { _id: generateId(), tipo: 'fisica', nome: 'Ana Costa', email: 'ana@email.com', celular: '(41) 98888-7777', cpfCnpj: '555.666.777-88', dataNascimento: '1988-12-01', genero: 'feminino', limiteCredito: 1500, saldoDevedor: 200, ativo: true, aprovado: true, criadoEm: now, atualizadoEm: now },
  ]
  saveAll(StorageKeys.CLIENTES, seed)
}

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const reload = useCallback(() => {
    setClientes(getAll<Cliente>(StorageKeys.CLIENTES))
  }, [])

  useEffect(() => {
    seedClientes()
    reload()
    setLoading(false)
  }, [reload])

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

  const adicionarCliente = useCallback((c: Omit<Cliente, '_id' | 'criadoEm' | 'atualizadoEm'>) => {
    const now = todayISO()
    const novo: Cliente = {
      ...c,
      nome: sanitize(c.nome),
      _id: generateId(),
      criadoEm: now,
      atualizadoEm: now,
    }
    const all = getAll<Cliente>(StorageKeys.CLIENTES)
    all.push(novo)
    saveAll(StorageKeys.CLIENTES, all)
    reload()
    toast.sucesso(`Cliente "${novo.nome}" cadastrado com sucesso`)
    return novo
  }, [reload, toast])

  const atualizarCliente = useCallback((id: string, updates: Partial<Cliente>) => {
    const all = getAll<Cliente>(StorageKeys.CLIENTES)
    const idx = all.findIndex(c => c._id === id)
    if (idx === -1) return
    all[idx] = { ...all[idx], ...updates, atualizadoEm: todayISO() }
    saveAll(StorageKeys.CLIENTES, all)
    reload()
    toast.sucesso('Cliente atualizado com sucesso')
  }, [reload, toast])

  const removerCliente = useCallback((id: string) => {
    const all = getAll<Cliente>(StorageKeys.CLIENTES).filter(c => c._id !== id)
    saveAll(StorageKeys.CLIENTES, all)
    reload()
    toast.sucesso('Cliente removido')
  }, [reload, toast])

  const atualizarSaldoDevedor = useCallback((id: string, valor: number) => {
    const all = getAll<Cliente>(StorageKeys.CLIENTES)
    const idx = all.findIndex(c => c._id === id)
    if (idx === -1) return
    all[idx].saldoDevedor += valor
    if (all[idx].saldoDevedor < 0) all[idx].saldoDevedor = 0
    all[idx].atualizadoEm = todayISO()
    saveAll(StorageKeys.CLIENTES, all)
    reload()
  }, [reload])

  return (
    <ClienteContext.Provider value={{
      clientes, loading, getCliente, buscarClientes,
      adicionarCliente, atualizarCliente, removerCliente, atualizarSaldoDevedor,
    }}>
      {children}
    </ClienteContext.Provider>
  )
}
