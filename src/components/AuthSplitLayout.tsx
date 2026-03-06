import { type ReactNode } from 'react'

export type PromoAlign = 'left' | 'right'

interface AuthSplitLayoutProps {
  promoTitle: string
  promoText: string
  promoIllustration?: ReactNode
  align?: PromoAlign
  children: ReactNode
}

const defaultIllustration = (
  <svg viewBox="0 0 400 300" className="h-full w-full max-h-[280px] max-w-[320px] object-contain opacity-95" aria-hidden>
    <defs>
      <linearGradient id="bgShape" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <ellipse cx="200" cy="160" rx="160" ry="120" fill="url(#bgShape)" />
    <rect x="140" y="100" width="120" height="90" rx="8" fill="white" stroke="#1E40AF" strokeWidth="2" opacity="0.9" />
    <circle cx="200" cy="145" r="15" fill="#1E40AF" opacity="0.7" />
    <rect x="165" y="170" width="70" height="8" rx="4" fill="#93C5FD" opacity="0.8" />
    <rect x="165" y="185" width="50" height="6" rx="3" fill="#BFDBFE" opacity="0.8" />
    <circle cx="280" cy="80" r="20" fill="#3B82F6" opacity="0.4" />
    <circle cx="320" cy="200" r="15" fill="#60A5FA" opacity="0.35" />
    <path d="M80 120 L100 140 L140 100" stroke="#1E40AF" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
  </svg>
)

export function AuthSplitLayout({
  promoTitle,
  promoText,
  promoIllustration = defaultIllustration,
  align = 'right',
  children,
}: AuthSplitLayoutProps) {
  const promoPanel = (
    <div
      className="
        flex min-h-[240px] flex-col items-center justify-center gap-6 bg-primary px-6 py-10
        md:min-h-full md:gap-8 md:px-8 md:py-12
        relative overflow-hidden
      "
    >
      {/* Detalhe sutil canto superior direito - rede/bolhas */}
      <div className="absolute right-0 top-0 h-48 w-48 opacity-20" aria-hidden>
        <svg viewBox="0 0 100 100" className="h-full w-full text-white">
          {[...Array(6)].map((_, i) => (
            <circle key={i} cx={20 + i * 16} cy={15 + (i % 3) * 25} r="4" fill="currentColor" />
          ))}
          {[...Array(5)].map((_, i) => (
            <line key={i} x1={20 + i * 20} y1="20" x2={40 + i * 15} y2="60" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          ))}
        </svg>
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4 text-center text-white md:gap-6">
        <div className="flex justify-center">{promoIllustration}</div>
        <h2 className="text-xl font-bold leading-tight md:text-2xl lg:text-3xl">{promoTitle}</h2>
        <p className="max-w-md text-sm leading-relaxed opacity-95 md:text-base">{promoText}</p>
      </div>
    </div>
  )

  const formPanel = (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center bg-white px-4 py-8 md:min-h-full md:px-8 md:py-12">
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {align === 'left' ? (
        <>
          {/* Mobile: formulário primeiro; desktop: painel promo à esquerda */}
          <div className="order-first flex flex-1 flex-col lg:w-1/2 lg:order-2">{formPanel}</div>
          <div className="order-2 flex-shrink-0 lg:order-first lg:block lg:w-1/2">
            <div className="hidden lg:block lg:h-full">{promoPanel}</div>
            <div className="bg-primary py-4 px-4 text-center text-white lg:hidden">
              <p className="text-sm font-semibold">{promoTitle}</p>
              <p className="text-xs opacity-90">{promoText}</p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Mobile: formulário primeiro; desktop: formulário à esquerda */}
          <div className="order-first flex flex-1 flex-col lg:w-1/2">{formPanel}</div>
          <div className="order-2 flex-shrink-0 lg:order-none lg:hidden">
            <div className="bg-primary py-4 px-4 text-center text-white">
              <p className="text-sm font-semibold">{promoTitle}</p>
              <p className="text-xs opacity-90">{promoText}</p>
            </div>
          </div>
          <div className="hidden lg:block lg:w-1/2 lg:flex-shrink-0">{promoPanel}</div>
        </>
      )}
    </div>
  )
}
