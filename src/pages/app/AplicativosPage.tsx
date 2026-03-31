import { Grid3X3, ShoppingCart, BarChart3, Truck, FileText, CreditCard, Smartphone, Cloud, Lock } from 'lucide-react'

const APPS = [
  { id: 1, nome: 'Marketplaces', desc: 'Integre com Mercado Livre, Shopee e outros marketplaces para vender online.', icon: ShoppingCart, status: 'disponivel' as const },
  { id: 2, nome: 'Relatórios Avançados', desc: 'Dashboards personalizados, exportação em PDF/Excel e indicadores de desempenho.', icon: BarChart3, status: 'em_breve' as const },
  { id: 3, nome: 'Logística', desc: 'Integração com transportadoras para cálculo de frete e rastreamento.', icon: Truck, status: 'em_breve' as const },
  { id: 4, nome: 'Nota Fiscal Eletrônica', desc: 'Emissão de NF-e e NFC-e diretamente pelo sistema.', icon: FileText, status: 'em_breve' as const },
  { id: 5, nome: 'Gateway de Pagamento', desc: 'Aceite pagamentos online com PIX, cartão e boleto automatizados.', icon: CreditCard, status: 'em_breve' as const },
  { id: 6, nome: 'App Mobile', desc: 'Acesse o MeuPDV pelo celular para consultas e vendas rápidas.', icon: Smartphone, status: 'em_breve' as const },
  { id: 7, nome: 'Backup na Nuvem', desc: 'Backup automático dos dados na nuvem com MongoDB Atlas.', icon: Cloud, status: 'disponivel' as const },
  { id: 8, nome: 'Controle de Acesso', desc: 'Permissões granulares por perfil e auditoria de ações.', icon: Lock, status: 'disponivel' as const },
]

const STATUS_LABELS = {
  disponivel: { label: 'Disponível', class: 'badge-green' },
  em_breve: { label: 'Em breve', class: 'badge-yellow' },
  ativo: { label: 'Ativo', class: 'badge-blue' },
}

export function AplicativosPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Grid3X3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Aplicativos</h1>
            <p className="text-sm text-text-secondary">Integrações e módulos disponíveis para o MeuPDV.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {APPS.map(app => {
            const Icon = app.icon
            const statusConfig = STATUS_LABELS[app.status]
            return (
              <div key={app.id} className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-card hover:border-primary/30 transition-colors">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary">{app.nome}</p>
                    <span className={statusConfig.class}>{statusConfig.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{app.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-xl border border-primary/30 bg-primary-pale p-4 text-center">
          <p className="text-sm text-text-primary">
            Novas integrações estão sendo desenvolvidas constantemente.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Entre em contato para solicitar uma integração específica.
          </p>
        </div>
      </div>
    </div>
  )
}
