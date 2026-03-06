import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Caixa, MovimentacaoCaixa } from '../types'
import { StorageKeys, getAll, saveAll, generateId, getNextNumber } from '../utils/storage'
import { todayISO } from '../utils/helpers'
import { useToast } from './ToastContext'
import { useAuth } from './AuthContext'

interface CaixaContextType {
  caixas: Caixa[]
  caixaAberto: Caixa | null
  loading: boolean
  abrirCaixa: (valorAbertura: number, observacoes?: string) => Caixa
  fecharCaixa: (id: string, observacoes?: string) => void
  registrarMovimentacao: (caixaId: string, mov: Omit<MovimentacaoCaixa, '_id' | 'criadoEm'>) => void
  registrarVenda: (caixaId: string, valor: number, vendaId: string) => void
  getCaixaById: (id: string) => Caixa | undefined
  getCaixasFechados: () => Caixa[]
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

  const reload = useCallback(() => {
    setCaixas(getAll<Caixa>(StorageKeys.CAIXAS))
  }, [])

  useEffect(() => {
    reload()
    setLoading(false)
  }, [reload])

  const caixaAberto = caixas.find(c => c.status === 'aberto') || null

  const abrirCaixa = useCallback((valorAbertura: number, observacoes?: string) => {
    // Verificar se já existe caixa aberto
    const all = getAll<Caixa>(StorageKeys.CAIXAS)
    const aberto = all.find(c => c.status === 'aberto')
    if (aberto) {
      toast.alerta('Ja existe um caixa aberto. Feche-o antes de abrir outro.')
      return aberto
    }

    const numero = getNextNumber(StorageKeys.NEXT_CAIXA_NUM)
    const novoCaixa: Caixa = {
      _id: generateId(),
      numero,
      operadorId: user?._id || '',
      operadorNome: user?.nome || 'Operador',
      status: 'aberto',
      valorAbertura,
      totalVendas: 0,
      totalEntradas: valorAbertura,
      totalSaidas: 0,
      movimentacoes: [{
        _id: generateId(),
        tipo: 'reforco',
        valor: valorAbertura,
        descricao: 'Abertura de caixa',
        criadoEm: todayISO(),
      }],
      abertoEm: todayISO(),
      observacoes,
    }

    all.push(novoCaixa)
    saveAll(StorageKeys.CAIXAS, all)
    reload()
    toast.sucesso(`Caixa #${numero} aberto com sucesso`)
    return novoCaixa
  }, [user, reload, toast])

  const fecharCaixa = useCallback((id: string, observacoes?: string) => {
    const all = getAll<Caixa>(StorageKeys.CAIXAS)
    const idx = all.findIndex(c => c._id === id)
    if (idx === -1) return

    const caixa = all[idx]
    caixa.status = 'fechado'
    caixa.fechadoEm = todayISO()
    caixa.valorFechamento = caixa.totalEntradas - caixa.totalSaidas
    if (observacoes) caixa.observacoes = (caixa.observacoes || '') + '\n' + observacoes

    saveAll(StorageKeys.CAIXAS, all)
    reload()
    toast.sucesso(`Caixa #${caixa.numero} fechado com sucesso`)
  }, [reload, toast])

  const registrarMovimentacao = useCallback((caixaId: string, mov: Omit<MovimentacaoCaixa, '_id' | 'criadoEm'>) => {
    const all = getAll<Caixa>(StorageKeys.CAIXAS)
    const idx = all.findIndex(c => c._id === caixaId)
    if (idx === -1) return

    const novaMov: MovimentacaoCaixa = {
      ...mov,
      _id: generateId(),
      criadoEm: todayISO(),
    }

    all[idx].movimentacoes.push(novaMov)

    if (mov.tipo === 'reforco') {
      all[idx].totalEntradas += mov.valor
    } else if (mov.tipo === 'sangria') {
      all[idx].totalSaidas += mov.valor
    }

    saveAll(StorageKeys.CAIXAS, all)
    reload()
    toast.sucesso(mov.tipo === 'reforco' ? 'Reforco registrado' : 'Sangria registrada')
  }, [reload, toast])

  const registrarVenda = useCallback((caixaId: string, valor: number, vendaId: string) => {
    const all = getAll<Caixa>(StorageKeys.CAIXAS)
    const idx = all.findIndex(c => c._id === caixaId)
    if (idx === -1) return

    all[idx].totalVendas += valor
    all[idx].totalEntradas += valor
    all[idx].movimentacoes.push({
      _id: generateId(),
      tipo: 'venda',
      valor,
      descricao: `Venda #${vendaId}`,
      criadoEm: todayISO(),
    })

    saveAll(StorageKeys.CAIXAS, all)
    reload()
  }, [reload])

  const getCaixaById = useCallback((id: string) => caixas.find(c => c._id === id), [caixas])

  const getCaixasFechados = useCallback(() => caixas.filter(c => c.status === 'fechado'), [caixas])

  return (
    <CaixaContext.Provider value={{
      caixas, caixaAberto, loading, abrirCaixa, fecharCaixa,
      registrarMovimentacao, registrarVenda, getCaixaById, getCaixasFechados,
    }}>
      {children}
    </CaixaContext.Provider>
  )
}
