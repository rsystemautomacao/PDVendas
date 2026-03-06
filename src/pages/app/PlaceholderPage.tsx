import { useLocation } from 'react-router-dom'

const TITLES: Record<string, string> = {
  'novo-pedido': 'Novo pedido',
  'vendas': 'Vendas',
  'compras': 'Compras',
  'produtos': 'Produtos e Serviços',
  'contas-a-receber': 'Contas a receber',
  'caixas': 'Caixas',
  'fluxo-de-caixa': 'Fluxo de caixa',
  'despesas': 'Despesas',
  'ajuda': 'Ajuda',
  'notificacoes': 'Notificações',
  'catalogo': 'Catálogo digital',
  'aplicativos': 'Aplicativos',
  'relatorios-graficos': 'Relatórios gráficos',
  'meu-usuario': 'Meu usuário',
  'minha-empresa': 'Minha empresa',
  'parametros': 'Parâmetros de Venda',
}

export function PlaceholderPage() {
  const location = useLocation()
  const slug = location.pathname.replace(/^\/app\/?/, '').split('/')[0] || 'app'
  const title = TITLES[slug] || slug.replace(/-/g, ' ')

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-text-primary capitalize">{title}</h1>
        <p className="mt-2 text-text-secondary">Em construção. Em breve você poderá usar esta funcionalidade.</p>
      </div>
    </div>
  )
}
