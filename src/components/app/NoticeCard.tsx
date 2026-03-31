import { Home } from 'lucide-react'

interface NoticeCardProps {
  title?: string
  items?: Array<{ icon?: React.ReactNode; text: string }>
}

export function NoticeCard({
  title = 'Avisos do sistema',
  items = [
    {
      text: 'Acesse a página de Minha Empresa e informe a cidade onde se localiza sua empresa.',
      icon: <Home className="h-4 w-4 flex-shrink-0" />,
    },
  ],
}: NoticeCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="bg-primary px-4 py-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-text-primary"
          >
            {item.icon}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
