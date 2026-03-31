import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { RelatorioClientes } from '../../components/app/RelatorioClientes'
import { getRelatorioBySlug } from '../../data/relatoriosClientes'

export function RelatorioClientesPage() {
  const { tipo } = useParams<{ tipo: string }>()
  const navigate = useNavigate()
  const config = tipo ? getRelatorioBySlug(tipo) : undefined

  if (!config) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-text-secondary">Relatório não encontrado.</p>
          <button
            type="button"
            onClick={() => navigate('/app/clientes/relatorios')}
            className="mt-4 text-primary font-medium hover:underline"
          >
            Voltar ao menu de relatórios
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-4 flex items-center gap-2 text-sm text-text-secondary" aria-label="Navegação">
          <button
            type="button"
            onClick={() => navigate('/app/clientes')}
            className="text-primary hover:underline"
          >
            Clientes
          </button>
          <span aria-hidden>/</span>
          <button
            type="button"
            onClick={() => navigate('/app/clientes/relatorios')}
            className="text-primary hover:underline"
          >
            Relatórios
          </button>
          <span aria-hidden>/</span>
          <span className="font-medium text-text-primary">{config.titulo}</span>
        </nav>

        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/app/clientes/relatorios')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Voltar ao menu de relatórios"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-text-primary">{config.titulo}</h1>
        </div>

        <RelatorioClientes config={config} />
      </div>
    </div>
  )
}
