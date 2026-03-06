import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { RELATORIOS_CLIENTES } from '../../data/relatoriosClientes'

export function RelatoriosMenuPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb / Aba: CLIENTES → RELATÓRIOS */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-text-secondary" aria-label="Navegação">
          <Link to="/app/clientes" className="text-primary hover:underline">
            Clientes
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-text-primary">Relatórios</span>
        </nav>

        <div className="rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden">
          <div className="bg-primary/10 px-4 py-3">
            <h1 className="text-lg font-bold text-text-primary">Menu de Relatórios</h1>
            <p className="text-sm text-text-secondary">Selecione o relatório desejado</p>
          </div>
          <ul className="divide-y divide-gray-100" role="list">
            {RELATORIOS_CLIENTES.map((rel) => (
              <li key={rel.slug}>
                <Link
                  to={`/app/clientes/relatorios/${rel.slug}`}
                  className="flex items-start gap-4 p-4 transition-colors bg-gradient-to-r from-white to-primary-pale/20 hover:to-primary-pale/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                >
                  <span
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                    aria-hidden
                  >
                    <Users className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-text-primary">{rel.titulo}</h2>
                    <p className="mt-1 text-sm text-text-secondary uppercase">
                      {rel.descricao}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
