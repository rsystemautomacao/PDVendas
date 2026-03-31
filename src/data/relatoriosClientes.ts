export interface RelatorioTipoConfig {
  slug: string
  titulo: string
  descricao: string
  /** Exibe filtros Data de / Data até */
  temFiltroData: boolean
  /** Exibe botões HOJE, ESTA SEMANA, etc. */
  temAtalhosPeriodo: boolean
  /** Exibe coluna Data de Cadastro */
  exibirDataCadastro: boolean
  /** Exibe coluna Endereço (checkbox no filtro) */
  exibirEndereco: boolean
  /** Relatório de vendas: colunas e filtro Cliente */
  isVendas: boolean
  /** Para vendas: resumido = uma linha por cliente; detalhado = múltiplas linhas */
  vendasDetalhado?: boolean
}

export const RELATORIOS_CLIENTES: RelatorioTipoConfig[] = [
  {
    slug: 'todos-os-clientes',
    titulo: 'Todos os clientes',
    descricao: 'Lista de todos os clientes ativos cadastrados no sistema.',
    temFiltroData: false,
    temAtalhosPeriodo: false,
    exibirDataCadastro: true,
    exibirEndereco: true,
    isVendas: false,
  },
  {
    slug: 'aniversariantes-mes',
    titulo: 'Aniversariantes do mês',
    descricao: 'Lista de todos os clientes que fazem aniversário no mês informado.',
    temFiltroData: true,
    temAtalhosPeriodo: true,
    exibirDataCadastro: true,
    exibirEndereco: true,
    isVendas: false,
  },
  {
    slug: 'aniversariantes-hoje',
    titulo: 'Aniversariantes de hoje',
    descricao: 'Lista de todos os aniversariantes do dia de hoje.',
    temFiltroData: false,
    temAtalhosPeriodo: false,
    exibirDataCadastro: true,
    exibirEndereco: true,
    isVendas: false,
  },
  {
    slug: 'com-credito-disponivel',
    titulo: 'Com crédito disponível',
    descricao: 'Lista os clientes que têm crédito disponível para compras no carnê / promissória.',
    temFiltroData: false,
    temAtalhosPeriodo: false,
    exibirDataCadastro: true,
    exibirEndereco: true,
    isVendas: false,
  },
  {
    slug: 'com-email-cadastrado',
    titulo: 'Com email cadastrado',
    descricao: 'Lista os clientes que têm e-mail cadastrado.',
    temFiltroData: false,
    temAtalhosPeriodo: false,
    exibirDataCadastro: true,
    exibirEndereco: true,
    isVendas: false,
  },
  {
    slug: 'com-algum-atraso',
    titulo: 'Com algum atraso',
    descricao: 'Clientes com alguma compra paga com carnê / promissória e que tem alguma parcela em atraso.',
    temFiltroData: false,
    temAtalhosPeriodo: false,
    exibirDataCadastro: true,
    exibirEndereco: true,
    isVendas: false,
  },
  {
    slug: 'vendas-mais-recentes',
    titulo: 'Vendas mais recentes',
    descricao: 'Lista a venda mais recente de cada cliente.',
    temFiltroData: true,
    temAtalhosPeriodo: true,
    exibirDataCadastro: false,
    exibirEndereco: false,
    isVendas: true,
    vendasDetalhado: false,
  },
  {
    slug: 'produtos-comprados-por-cliente',
    titulo: 'Produtos comprados por cliente',
    descricao: 'Lista todos os produtos comprados por um cliente informado.',
    temFiltroData: true,
    temAtalhosPeriodo: true,
    exibirDataCadastro: false,
    exibirEndereco: false,
    isVendas: true,
    vendasDetalhado: true,
  },
  {
    slug: 'maiores-compradores',
    titulo: 'Maiores compradores',
    descricao: 'Lista os clientes que efetuaram mais compras no sistema. Ordenados do maior para o menor.',
    temFiltroData: true,
    temAtalhosPeriodo: true,
    exibirDataCadastro: false,
    exibirEndereco: false,
    isVendas: true,
    vendasDetalhado: false,
  },
  {
    slug: 'vendas-por-cliente-resumidas',
    titulo: 'Vendas por cliente (resumidas)',
    descricao: 'Lista de forma resumida as vendas efetuadas para clientes.',
    temFiltroData: true,
    temAtalhosPeriodo: true,
    exibirDataCadastro: false,
    exibirEndereco: false,
    isVendas: true,
    vendasDetalhado: false,
  },
  {
    slug: 'vendas-por-cliente-detalhadas',
    titulo: 'Vendas por cliente (detalhadas)',
    descricao: 'Lista de forma detalhada as vendas efetuadas para clientes.',
    temFiltroData: true,
    temAtalhosPeriodo: true,
    exibirDataCadastro: false,
    exibirEndereco: false,
    isVendas: true,
    vendasDetalhado: true,
  },
]

export function getRelatorioBySlug(slug: string): RelatorioTipoConfig | undefined {
  return RELATORIOS_CLIENTES.find((r) => r.slug === slug)
}
