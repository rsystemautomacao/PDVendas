import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook para verificar permissoes do usuario logado.
 * Admin sempre tem acesso total.
 * Sub-usuarios (caixa/gerente) usam o campo user.permissoes.
 */
export function usePermissao() {
  const { user } = useAuth()

  const temPermissao = useCallback((permissaoId: string): boolean => {
    if (!user) return false
    // Admin tem acesso total
    if (user.role === 'admin') return true
    // Sub-usuarios verificam permissoes
    return user.permissoes?.[permissaoId] === true
  }, [user])

  const isAdmin = user?.role === 'admin'

  return { temPermissao, isAdmin }
}

/**
 * Mapa de rota -> permissao necessaria.
 * Usado pelo Sidebar e pelo guard de rota.
 */
export const ROTA_PERMISSAO: Record<string, string> = {
  '/app/novo-pedido': 'vendas.criar',
  '/app/vendas': 'vendas.visualizar',
  '/app/clientes': 'clientes.visualizar',
  '/app/produtos': 'produtos.visualizar',
  '/app/caixas': 'caixa.abrir',
  '/app/contas-a-pagar': 'financeiro.contas_pagar',
  '/app/contas-a-receber': 'financeiro.contas_receber',
  '/app/despesas': 'financeiro.despesas',
  '/app/fluxo-de-caixa': 'financeiro.fluxo_caixa',
  '/app/relatorios-graficos': 'relatorios.visualizar',
  '/app/catalogo': 'relatorios.visualizar',
  '/app/config/minha-empresa': 'config.empresa',
  '/app/config/parametros': 'config.parametros',
}
