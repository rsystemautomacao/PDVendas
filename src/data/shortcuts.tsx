import {
  ShoppingCart,
  Package,
  Users,
  Box,
  Receipt,
  CreditCard,
  Wallet,
  TrendingUp,
  CircleDollarSign,
} from 'lucide-react'

export interface ShortcutItem {
  to: string
  title: string
  subtitle: string
  shortcut: string
  icon: React.ReactNode
}

export const SHORTCUTS: ShortcutItem[] = [
  {
    to: '/app/novo-pedido',
    title: 'Novo Pedido',
    subtitle: 'Gerar nova Venda / Orçamento / Pré-pedido',
    shortcut: 'F2',
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    to: '/app/compras',
    title: 'Nova Compra',
    subtitle: 'Lançar Pedido de Compra / Reabastecer estoque',
    shortcut: 'F3',
    icon: <Package className="h-5 w-5" />,
  },
  {
    to: '/app/clientes',
    title: 'Clientes',
    subtitle: 'Ver / cadastrar clientes',
    shortcut: 'F4',
    icon: <Users className="h-5 w-5" />,
  },
  {
    to: '/app/produtos',
    title: 'Produtos e Serviços',
    subtitle: 'Ver / cadastrar produtos e serviços',
    shortcut: 'F5',
    icon: <Box className="h-5 w-5" />,
  },
  {
    to: '/app/contas-a-receber',
    title: 'Contas a receber',
    subtitle: 'Recebimentos em aberto',
    shortcut: 'F6',
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    to: '/app/contas-a-pagar',
    title: 'Contas a pagar',
    subtitle: 'Ver / cadastrar contas a pagar',
    shortcut: 'F7',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    to: '/app/caixas',
    title: 'Caixas',
    subtitle: 'Ver / editar caixas de venda',
    shortcut: 'F8',
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    to: '/app/fluxo-de-caixa',
    title: 'Fluxo de Caixa',
    subtitle: 'Ver todas as entradas e saídas no período.',
    shortcut: 'F9',
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    to: '/app/despesas',
    title: 'Despesas',
    subtitle: 'Lançar nova Despesa Rápida (conta a pagar)',
    shortcut: 'F10',
    icon: <CircleDollarSign className="h-5 w-5" />,
  },
]
