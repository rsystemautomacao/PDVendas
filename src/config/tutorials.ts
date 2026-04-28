import {
  Home, Building2, Box, Users, ShoppingCart, LayoutDashboard,
  DollarSign, Receipt, BarChart3, Plus, Search,
  CreditCard, TrendingUp, Tag,
  Settings, AlertTriangle, RefreshCw, Wrench, Store,
  CheckCircle2, UserPlus,
  ArrowUpCircle, ArrowDownCircle, Eye, Sparkles,
} from 'lucide-react'
import type { TutorialStep } from '../components/app/TutorialModal'

// ============================================================
// DASHBOARD
// ============================================================
export const tutorialDashboard: TutorialStep[] = [
  {
    titulo: 'Bem-vindo ao MeuPDV!',
    descricao: 'Este e o seu painel principal. Aqui voce tem uma visao geral de tudo que acontece na sua loja: vendas do dia, estoque, financeiro e muito mais.',
    icon: Home,
    iconColor: 'text-primary',
    itens: [
      'Vendas de hoje e do mes em tempo real',
      'Produtos com estoque baixo',
      'Contas a pagar e receber pendentes',
      'Grafico de vendas dos ultimos 7 dias',
    ],
  },
  {
    titulo: 'Primeiros passos',
    descricao: 'Para comecar a usar o sistema, siga esta ordem recomendada:',
    icon: Sparkles,
    iconColor: 'text-violet-500',
    itens: [
      '1. Configure os dados da sua empresa (menu Configuracoes)',
      '2. Cadastre seus produtos com precos e estoque',
      '3. Cadastre seus clientes',
      '4. Abra um caixa para comecar a vender',
      '5. Faca sua primeira venda!',
    ],
    dica: 'Use o menu lateral (icone no canto superior esquerdo) para navegar entre as paginas.',
  },
  {
    titulo: 'Atalhos rapidos',
    descricao: 'No painel voce encontra botoes de acesso rapido para as acoes mais usadas do dia a dia.',
    icon: ShoppingCart,
    iconColor: 'text-emerald-500',
    itens: [
      'Clique em "Nova Venda" para ir direto ao PDV',
      'Clique em "Abrir Caixa" se ainda nao tem caixa aberto',
      'Clique nos cards para ver detalhes de cada area',
    ],
    dica: 'Os numeros do Dashboard atualizam automaticamente conforme voce usa o sistema.',
  },
]

// ============================================================
// MINHA EMPRESA
// ============================================================
export const tutorialMinhaEmpresa: TutorialStep[] = [
  {
    titulo: 'Dados da Empresa',
    descricao: 'Configure aqui as informacoes da sua empresa. Esses dados aparecem nos recibos de venda, relatorios e no catalogo online.',
    icon: Building2,
    iconColor: 'text-violet-500',
    itens: [
      'Nome fantasia e razao social',
      'CNPJ da empresa',
      'Endereco completo',
      'Telefone e email de contato',
    ],
  },
  {
    titulo: 'Logo da Empresa',
    descricao: 'Adicione o logotipo da sua empresa para personalizar os recibos e o catalogo online.',
    icon: Building2,
    iconColor: 'text-blue-500',
    itens: [
      'Clique em "Enviar Logo" para fazer upload',
      'Formatos aceitos: JPG, PNG (max 500KB)',
      'A logo aparece nos recibos e catalogo publico',
    ],
    dica: 'Use uma imagem quadrada para melhor resultado. Recomendamos 200x200 pixels.',
  },
  {
    titulo: 'Segmento da Empresa',
    descricao: 'Selecione o segmento da sua empresa para que o sistema adapte funcionalidades especificas para o seu tipo de negocio.',
    icon: Store,
    iconColor: 'text-emerald-500',
    itens: [
      'Varejo, Roupas, Informatica, Alimentos...',
      'Assistencia Tecnica habilita Ordens de Servico',
      'Cada segmento personaliza o sistema para voce',
    ],
    dica: 'Voce pode alterar o segmento a qualquer momento.',
  },
]

// ============================================================
// PRODUTOS
// ============================================================
export const tutorialProdutos: TutorialStep[] = [
  {
    titulo: 'Seus Produtos',
    descricao: 'Aqui voce gerencia todo o catalogo de produtos e servicos da sua loja. Use a busca e os filtros para encontrar rapidamente o que precisa.',
    icon: Box,
    iconColor: 'text-blue-500',
    itens: [
      'Veja todos os produtos cadastrados',
      'Filtre por tipo (produto ou servico) e status',
      'Busque por nome, codigo ou codigo de barras',
    ],
  },
  {
    titulo: 'Cadastrando um Produto',
    descricao: 'Clique no botao "+ Novo" para cadastrar um novo produto. Preencha as informacoes basicas:',
    icon: Plus,
    iconColor: 'text-emerald-500',
    itens: [
      'Nome e codigo do produto (obrigatorios)',
      'Preco de venda e preco de custo',
      'Estoque atual e estoque minimo para alertas',
      'Codigo de barras (pode usar a camera para ler)',
      'Grupo/categoria para organizar seus produtos',
    ],
    dica: 'O codigo de barras pode ser lido com a camera do celular na hora da venda!',
  },
  {
    titulo: 'Preco de Atacado',
    descricao: 'Voce pode configurar um preco especial de atacado para vendas em grande quantidade.',
    icon: Tag,
    iconColor: 'text-amber-500',
    itens: [
      'Defina o preco de atacado no cadastro do produto',
      'Defina a quantidade minima para aplicar o atacado',
      'O sistema aplica o preco automaticamente na venda',
    ],
    dica: 'Exemplo: Produto custa R$10, mas acima de 10 unidades sai por R$8 cada.',
  },
  {
    titulo: 'Estoque e Validade',
    descricao: 'Controle o estoque dos seus produtos e receba alertas quando estiverem acabando ou vencendo.',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    itens: [
      'Defina o "estoque minimo" para receber alertas',
      'Produtos abaixo do minimo aparecem no Dashboard',
      'Configure a data de validade para produtos pereciveis',
      'Acesse a pagina "Validade" para ver produtos vencendo',
    ],
    dica: 'O sistema bloqueia vendas quando o estoque chega a zero.',
  },
]

// ============================================================
// CLIENTES
// ============================================================
export const tutorialClientes: TutorialStep[] = [
  {
    titulo: 'Seus Clientes',
    descricao: 'Gerencie a base de clientes da sua loja. O cadastro de clientes permite vincular vendas, controlar crediario e gerar relatorios.',
    icon: Users,
    iconColor: 'text-blue-500',
    itens: [
      'Veja todos os clientes cadastrados',
      'Busque por nome, CPF/CNPJ, email ou telefone',
      'Filtre clientes ativos e inativos',
    ],
  },
  {
    titulo: 'Cadastrando um Cliente',
    descricao: 'Clique em "+ Novo" para cadastrar. Apenas o nome e obrigatorio, mas quanto mais dados melhor!',
    icon: UserPlus,
    iconColor: 'text-emerald-500',
    itens: [
      'Nome completo (obrigatorio)',
      'CPF ou CNPJ para identificacao',
      'Telefone e email para contato',
      'Endereco completo para entregas',
    ],
    dica: 'Na hora da venda voce pode selecionar o cliente para vincular a compra ao cadastro dele.',
  },
  {
    titulo: 'Crediario e Saldo Devedor',
    descricao: 'Ao usar a forma de pagamento "Crediario" na venda, o sistema gera automaticamente as parcelas em Contas a Receber.',
    icon: DollarSign,
    iconColor: 'text-amber-500',
    itens: [
      'Parcelas sao criadas automaticamente',
      'Acompanhe pagamentos em "Contas a Receber"',
      'O saldo devedor do cliente e atualizado',
    ],
    dica: 'Voce pode definir o numero de parcelas na hora da venda.',
  },
]

// ============================================================
// NOVA VENDA (PDV)
// ============================================================
export const tutorialNovaVenda: TutorialStep[] = [
  {
    titulo: 'Ponto de Venda (PDV)',
    descricao: 'Esta e a tela principal de vendas! Aqui voce monta o carrinho, aplica descontos e finaliza a venda.',
    icon: ShoppingCart,
    iconColor: 'text-emerald-500',
    itens: [
      'Busque produtos pelo nome, codigo ou codigo de barras',
      'Adicione itens ao carrinho com um clique',
      'Ajuste quantidades com os botoes + e -',
      'Aplique desconto em valor ou percentual',
    ],
    dica: 'Antes de vender, e necessario ter um caixa aberto! Abra em "Caixas".',
  },
  {
    titulo: 'Buscando Produtos',
    descricao: 'Use a barra de busca no topo para encontrar produtos de varias formas:',
    icon: Search,
    iconColor: 'text-blue-500',
    itens: [
      'Digite o nome do produto (ex: "Coca")',
      'Digite o codigo (ex: "001")',
      'Escaneie o codigo de barras com a camera (icone da camera)',
      'Use um leitor de codigo de barras USB',
    ],
    dica: 'Ao escanear um codigo de barras, o produto e adicionado automaticamente ao carrinho!',
  },
  {
    titulo: 'Vinculando Cliente',
    descricao: 'Voce pode vincular um cliente a venda para controle e historico de compras.',
    icon: Users,
    iconColor: 'text-violet-500',
    itens: [
      'Clique no icone de cliente acima do carrinho',
      'Busque pelo nome do cliente cadastrado',
      'Selecione o cliente para vincular a venda',
      'Caso nao tenha cadastro, a venda sai como "Consumidor Final"',
    ],
  },
  {
    titulo: 'Formas de Pagamento',
    descricao: 'Na hora de finalizar, escolha a forma de pagamento e o valor. Voce pode usar mais de uma forma na mesma venda!',
    icon: CreditCard,
    iconColor: 'text-green-500',
    itens: [
      'Dinheiro - o sistema calcula o troco automaticamente',
      'Cartao de Credito - com opcao de parcelamento',
      'Cartao de Debito e PIX',
      'Crediario - gera parcelas automaticamente',
    ],
    dica: 'Voce pode dividir o pagamento. Ex: parte no dinheiro e parte no cartao.',
  },
  {
    titulo: 'Finalizando a Venda',
    descricao: 'Apos adicionar o pagamento, clique em "Finalizar Venda". O recibo sera gerado automaticamente.',
    icon: Receipt,
    iconColor: 'text-primary',
    itens: [
      'O recibo pode ser impresso na impressora termica',
      'Envie o recibo por WhatsApp para o cliente',
      'O estoque e atualizado automaticamente',
      'A venda e registrada no caixa aberto',
    ],
    dica: 'Configure a impressora em Configuracoes > Impressoras para impressao automatica.',
  },
]

// ============================================================
// CAIXAS
// ============================================================
export const tutorialCaixas: TutorialStep[] = [
  {
    titulo: 'Controle de Caixa',
    descricao: 'O caixa precisa estar aberto para que voce possa registrar vendas. Cada caixa registra todas as movimentacoes do periodo.',
    icon: LayoutDashboard,
    iconColor: 'text-primary',
    itens: [
      'Abra o caixa no inicio do expediente',
      'Feche o caixa no final do dia',
      'Todas as vendas ficam vinculadas ao caixa',
    ],
  },
  {
    titulo: 'Abrindo um Caixa',
    descricao: 'Clique em "Abrir Caixa" e informe o valor de abertura (troco inicial).',
    icon: Plus,
    iconColor: 'text-emerald-500',
    itens: [
      'Informe o valor em dinheiro no caixa',
      'O sistema cria um novo caixa numerado',
      'So pode ter um caixa aberto por vez',
    ],
    dica: 'O valor de abertura e o dinheiro de troco que voce colocou no caixa.',
  },
  {
    titulo: 'Reforco e Sangria',
    descricao: 'Durante o dia, voce pode registrar entradas (reforco) e saidas (sangria) de dinheiro do caixa.',
    icon: ArrowUpCircle,
    iconColor: 'text-blue-500',
    itens: [
      'Reforco: quando coloca mais dinheiro no caixa',
      'Sangria: quando retira dinheiro do caixa',
      'Todas as movimentacoes ficam registradas',
    ],
    dica: 'Use sangria para retirar valores grandes, por seguranca.',
  },
  {
    titulo: 'Fechando o Caixa',
    descricao: 'No final do dia, feche o caixa para ver o resumo completo de todas as movimentacoes.',
    icon: CheckCircle2,
    iconColor: 'text-amber-500',
    itens: [
      'O sistema mostra o total de vendas por forma de pagamento',
      'Voce ve o saldo final esperado',
      'Adicione observacoes se necessario',
      'Caixas fechados ficam no historico para consulta',
    ],
  },
]

// ============================================================
// VENDAS
// ============================================================
export const tutorialVendas: TutorialStep[] = [
  {
    titulo: 'Historico de Vendas',
    descricao: 'Consulte todas as vendas realizadas. Use os filtros de data para encontrar vendas especificas.',
    icon: Receipt,
    iconColor: 'text-primary',
    itens: [
      'Filtre vendas por periodo (data inicio e fim)',
      'Veja o total de vendas no periodo selecionado',
      'Busque por numero da venda ou cliente',
    ],
  },
  {
    titulo: 'Detalhes e Acoes',
    descricao: 'Clique no icone de olho para ver os detalhes completos da venda.',
    icon: Eye,
    iconColor: 'text-blue-500',
    itens: [
      'Lista de todos os itens vendidos',
      'Formas de pagamento utilizadas',
      'Reimprima o recibo quando necessario',
      'Cancele a venda (o estoque sera devolvido)',
    ],
    dica: 'Ao cancelar uma venda, o estoque dos produtos e devolvido automaticamente.',
  },
]

// ============================================================
// CONTAS A PAGAR
// ============================================================
export const tutorialContasPagar: TutorialStep[] = [
  {
    titulo: 'Contas a Pagar',
    descricao: 'Controle todas as contas e despesas que sua empresa precisa pagar. Nunca mais perca um vencimento!',
    icon: ArrowDownCircle,
    iconColor: 'text-red-500',
    itens: [
      'Cadastre contas com valor, vencimento e descricao',
      'Visualize contas pendentes e pagas',
      'Contas vencidas ficam destacadas em vermelho',
    ],
  },
  {
    titulo: 'Registrando Pagamento',
    descricao: 'Quando pagar uma conta, clique no botao de confirmar para marcar como paga.',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    itens: [
      'Clique no icone de check para marcar como paga',
      'A conta muda de "pendente" para "paga"',
      'O historico de pagamentos fica registrado',
    ],
    dica: 'As contas a pagar aparecem no Fluxo de Caixa e no Dashboard.',
  },
]

// ============================================================
// CONTAS A RECEBER
// ============================================================
export const tutorialContasReceber: TutorialStep[] = [
  {
    titulo: 'Contas a Receber',
    descricao: 'Acompanhe todos os valores que voce tem a receber. Parcelas de crediario sao criadas automaticamente aqui.',
    icon: ArrowUpCircle,
    iconColor: 'text-emerald-500',
    itens: [
      'Vendas no crediario geram parcelas automaticamente',
      'Cadastre manualmente valores a receber',
      'Controle vencimentos e atrasos',
    ],
  },
  {
    titulo: 'Recebendo Pagamento',
    descricao: 'Quando o cliente pagar, marque a parcela como recebida.',
    icon: DollarSign,
    iconColor: 'text-green-500',
    itens: [
      'Clique no icone de check para marcar como recebida',
      'Parcelas de crediario mostram o numero da venda',
      'Acompanhe o status: pendente, recebida ou atrasada',
    ],
    dica: 'Use o filtro para ver apenas parcelas pendentes ou atrasadas.',
  },
]

// ============================================================
// TROCAS E DEVOLUÇÕES
// ============================================================
export const tutorialTrocas: TutorialStep[] = [
  {
    titulo: 'Trocas e Devolucoes',
    descricao: 'Gerencie trocas de produtos e devolucoes de vendas de forma organizada.',
    icon: RefreshCw,
    iconColor: 'text-orange-500',
    itens: [
      'Troca: o cliente devolve um produto e leva outro',
      'Devolucao: o cliente devolve o produto e recebe o dinheiro',
      'O estoque e atualizado automaticamente ao aprovar',
    ],
  },
  {
    titulo: 'Criando uma Troca/Devolucao',
    descricao: 'Clique em "+ Nova Troca" e siga os passos:',
    icon: Plus,
    iconColor: 'text-emerald-500',
    itens: [
      '1. Busque a venda original pelo numero',
      '2. Selecione os itens que o cliente esta devolvendo',
      '3. Para troca, adicione os novos itens',
      '4. Informe o motivo da troca/devolucao',
      '5. A diferenca de valor e calculada automaticamente',
    ],
    dica: 'A troca precisa ser aprovada por um administrador antes do estoque ser atualizado.',
  },
]

// ============================================================
// RELATÓRIOS
// ============================================================
export const tutorialRelatorios: TutorialStep[] = [
  {
    titulo: 'Relatorios e Graficos',
    descricao: 'Analise o desempenho da sua loja com graficos e relatorios detalhados.',
    icon: BarChart3,
    iconColor: 'text-primary',
    itens: [
      'Vendas por periodo com graficos de barras',
      'Produtos mais vendidos',
      'Analise financeira (receitas vs despesas)',
      'Ranking de clientes por valor de compra',
    ],
  },
  {
    titulo: 'Filtros e Periodos',
    descricao: 'Use os filtros para analisar periodos especificos e comparar resultados.',
    icon: Search,
    iconColor: 'text-blue-500',
    itens: [
      'Filtre por: Hoje, Semana, Mes, Ano',
      'Defina um periodo personalizado',
      'Alterne entre diferentes tipos de relatorio',
    ],
    dica: 'Use os relatorios para identificar seus produtos campeoes de venda!',
  },
]

// ============================================================
// DESPESAS
// ============================================================
export const tutorialDespesas: TutorialStep[] = [
  {
    titulo: 'Controle de Despesas',
    descricao: 'Registre todas as despesas da empresa para ter um controle financeiro completo.',
    icon: Receipt,
    iconColor: 'text-red-500',
    itens: [
      'Cadastre despesas com categoria, valor e vencimento',
      'Acompanhe despesas pagas e pendentes',
      'Os valores aparecem no Fluxo de Caixa',
    ],
  },
  {
    titulo: 'Cadastrando uma Despesa',
    descricao: 'Clique em "+ Nova Despesa" e preencha os dados:',
    icon: Plus,
    iconColor: 'text-emerald-500',
    itens: [
      'Descricao da despesa (ex: Aluguel, Energia)',
      'Valor e data de vencimento',
      'Categoria para organizar (Fixa, Variavel, etc.)',
      'Marque como paga quando efetuar o pagamento',
    ],
    dica: 'Despesas fixas como aluguel podem ser cadastradas todo mes.',
  },
]

// ============================================================
// FLUXO DE CAIXA
// ============================================================
export const tutorialFluxoCaixa: TutorialStep[] = [
  {
    titulo: 'Fluxo de Caixa',
    descricao: 'Veja o panorama completo de entradas e saidas de dinheiro da sua empresa.',
    icon: TrendingUp,
    iconColor: 'text-primary',
    itens: [
      'Entradas: vendas + contas recebidas',
      'Saidas: contas pagas + despesas',
      'Saldo: diferenca entre entradas e saidas',
    ],
  },
  {
    titulo: 'Analisando o Fluxo',
    descricao: 'Use os filtros de periodo para analisar diferentes momentos do seu negocio.',
    icon: BarChart3,
    iconColor: 'text-blue-500',
    itens: [
      'Hoje, Esta Semana, Este Mes ou Mes Anterior',
      'Periodo personalizado com datas especificas',
      'Veja o detalhamento de cada entrada e saida',
    ],
    dica: 'Um saldo positivo significa que entrou mais dinheiro do que saiu. Monitore isso diariamente!',
  },
]

// ============================================================
// ORDENS DE SERVICO
// ============================================================
export const tutorialOrdensServico: TutorialStep[] = [
  {
    titulo: 'Ordens de Servico',
    descricao: 'Gerencie os servicos prestados pela sua assistencia tecnica. Cada OS acompanha um equipamento do cliente.',
    icon: Wrench,
    iconColor: 'text-orange-500',
    itens: [
      'Cadastre OS com dados do cliente e equipamento',
      'Acompanhe o status: Aberta, Em Execucao, Concluida',
      'Adicione pecas, servicos e valores',
    ],
  },
  {
    titulo: 'Fluxo de uma OS',
    descricao: 'Uma ordem de servico passa por varias etapas:',
    icon: Settings,
    iconColor: 'text-blue-500',
    itens: [
      '1. Aberta - equipamento recebido para analise',
      '2. Em Analise - diagnostico do problema',
      '3. Orcamento Enviado - aguardando aprovacao',
      '4. Aprovada - cliente aprovou o orcamento',
      '5. Em Execucao - servico sendo realizado',
      '6. Concluida - pronto para retirada',
    ],
    dica: 'Voce tambem pode criar orcamentos e converte-los em OS quando aprovados.',
  },
]
