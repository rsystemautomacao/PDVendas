import { Monitor, Smartphone } from 'lucide-react'

interface BannerProps {
  title?: string
  subtitle?: string
  ctaText?: string
  onCtaClick?: () => void
}

export function Banner({
  title = 'Começando agora no MeuPDV?',
  subtitle = 'e veja o guia rápido com tudo que você precisa para dar os primeiros passos!',
  ctaText = 'Clique aqui',
  onCtaClick,
}: BannerProps) {
  return (
    <div className="rounded-xl bg-gray-800 p-5 text-white shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm opacity-95">
            <button
              type="button"
              onClick={onCtaClick}
              className="font-semibold text-primary-light underline hover:no-underline"
            >
              {ctaText}
            </button>
            {' '}
            {subtitle}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-4 opacity-90">
          <Monitor className="h-12 w-12" aria-hidden />
          <Smartphone className="h-10 w-10" aria-hidden />
        </div>
      </div>
    </div>
  )
}
