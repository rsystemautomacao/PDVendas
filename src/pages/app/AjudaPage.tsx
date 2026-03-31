import { useState } from 'react'
import { HelpCircle, ChevronDown, ShoppingCart, Wallet, BarChart3, Settings, Package } from 'lucide-react'

interface FaqItem {
  pergunta: string
  resposta: string
}

interface FaqSection {
  titulo: string
  icon: typeof HelpCircle
  itens: FaqItem[]
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    titulo: 'Primeiros Passos',
    icon: HelpCircle,
    itens: [
      {
        pergunta: 'Como começar a usar o MeuPDV?',
        resposta: 'Após o cadastro, configure os dados da empresa em Configurações > Minha Empresa. Depois, cadastre seus produtos em Produtos e já pode começar a vender abrindo o caixa.',
      },
      {
        pergunta: 'Como cadastrar produtos?',
        resposta: 'Acesse o menu Produtos e clique em "Novo Produto". Preencha nome, código, preço de venda, estoque e demais informações. O produto ficará disponível imediatamente para vendas.',
      },
      {
        pergunta: 'Como cadastrar clientes?',
        resposta: 'Acesse o menu Clientes e clique em "Novo Cliente". Você pode cadastrar pessoas físicas (CPF) ou jurídicas (CNPJ), com endereço, limite de crédito e outras informações.',
      },
    ],
  },
  {
    titulo: 'Vendas',
    icon: ShoppingCart,
    itens: [
      {
        pergunta: 'Como realizar uma venda?',
        resposta: 'Abra o caixa em Caixas, depois acesse Nova Venda (PDV). Busque e adicione produtos, selecione o cliente (opcional), aplique descontos se necessário e finalize escolhendo a forma de pagamento.',
      },
      {
        pergunta: 'É possível cancelar uma venda?',
        resposta: 'Sim. Acesse o menu Vendas, localize a venda e clique no botão de cancelamento. Será necessário informar o motivo. O estoque será automaticamente restaurado.',
      },
      {
        pergunta: 'Quais formas de pagamento estão disponíveis?',
        resposta: 'O sistema aceita Dinheiro, Cartão de Crédito, Cartão de Débito, PIX, Boleto e Crediário. Você pode dividir o pagamento em múltiplas formas.',
      },
    ],
  },
  {
    titulo: 'Caixa',
    icon: Wallet,
    itens: [
      {
        pergunta: 'Como abrir e fechar o caixa?',
        resposta: 'Acesse o menu Caixas. Para abrir, informe o valor de abertura. Para fechar, revise o resumo de movimentações e confirme. O sistema calcula automaticamente o saldo final.',
      },
      {
        pergunta: 'O que é sangria e reforço?',
        resposta: 'Sangria é a retirada de dinheiro do caixa (ex: para depositar no banco). Reforço é a adição de troco ao caixa. Ambas as operações ficam registradas no histórico.',
      },
    ],
  },
  {
    titulo: 'Financeiro',
    icon: BarChart3,
    itens: [
      {
        pergunta: 'Como controlar contas a pagar e receber?',
        resposta: 'Acesse os menus Contas a Pagar e Contas a Receber no módulo Financeiro. Você pode cadastrar, dar baixa em pagamentos e visualizar contas atrasadas.',
      },
      {
        pergunta: 'O que é o Fluxo de Caixa?',
        resposta: 'O Fluxo de Caixa consolida todas as movimentações financeiras (vendas, recebimentos, pagamentos e despesas) em uma visão unificada por período.',
      },
    ],
  },
  {
    titulo: 'Estoque',
    icon: Package,
    itens: [
      {
        pergunta: 'Como dar entrada no estoque?',
        resposta: 'Utilize o módulo Compras para registrar compras de fornecedores. Ao marcar uma compra como "Recebida", o estoque dos produtos é automaticamente atualizado.',
      },
      {
        pergunta: 'O que acontece quando o estoque fica baixo?',
        resposta: 'Produtos com estoque abaixo do mínimo são destacados em vermelho na lista de produtos e aparecem como alerta no Dashboard e no Catálogo.',
      },
    ],
  },
  {
    titulo: 'Configurações',
    icon: Settings,
    itens: [
      {
        pergunta: 'Como alterar os dados da empresa?',
        resposta: 'Acesse Configurações > Minha Empresa. Lá você pode atualizar razão social, CNPJ, endereço, telefone e outros dados cadastrais.',
      },
      {
        pergunta: 'Como alterar minha senha?',
        resposta: 'Acesse Configurações > Meu Usuário. Clique em "Alterar" na seção de senha, informe a senha atual e defina a nova senha.',
      },
    ],
  },
]

export function AjudaPage() {
  const [expandido, setExpandido] = useState<string | null>(null)

  const toggle = (key: string) => {
    setExpandido(prev => prev === key ? null : key)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Central de Ajuda</h1>
            <p className="text-sm text-text-secondary">Perguntas frequentes sobre o MeuPDV.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {FAQ_SECTIONS.map(section => {
            const Icon = section.icon
            return (
              <div key={section.titulo} className="rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden">
                <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-text-primary">{section.titulo}</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {section.itens.map((item, idx) => {
                    const key = `${section.titulo}-${idx}`
                    const isOpen = expandido === key
                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() => toggle(key)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-text-primary pr-4">{item.pergunta}</span>
                          <ChevronDown className={`h-4 w-4 flex-shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-3 text-sm text-text-secondary animate-fade-in">
                            {item.resposta}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Info do Sistema */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-card text-center">
          <p className="text-sm text-text-secondary">
            <strong>MeuPDV</strong> - Sistema de Gestão e Vendas Online
          </p>
          <p className="mt-1 text-xs text-text-muted">Versão 1.0.0 - Preparado para MongoDB Atlas</p>
        </div>
      </div>
    </div>
  )
}
