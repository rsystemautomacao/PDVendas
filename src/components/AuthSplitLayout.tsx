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
  <svg viewBox="0 0 400 300" className="h-full w-full max-h-[280px] max-w-[320px] object-contain" aria-hidden>
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.15" />
        <stop offset="100%" stopColor="white" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    {/* Main card */}
    <rect x="120" y="70" width="160" height="130" rx="16" fill="url(#cardGrad)" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
    {/* Shopping bag icon */}
    <path d="M175 105 L168 112 v28 a4 4 0 004 4h56 a4 4 0 004-4v-28 l-7-7z" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    <line x1="168" y1="112" x2="232" y2="112" stroke="white" strokeWidth="2" opacity="0.7" />
    <path d="M216 120 a16 16 0 01-32 0" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
    {/* Chart bars */}
    <rect x="146" y="165" width="12" height="20" rx="3" fill="white" opacity="0.3" />
    <rect x="164" y="155" width="12" height="30" rx="3" fill="white" opacity="0.4" />
    <rect x="182" y="145" width="12" height="40" rx="3" fill="white" opacity="0.5" />
    <rect x="200" y="150" width="12" height="35" rx="3" fill="white" opacity="0.4" />
    <rect x="218" y="140" width="12" height="45" rx="3" fill="white" opacity="0.6" />
    <rect x="236" y="130" width="12" height="55" rx="3" fill="white" opacity="0.5" />
    {/* Check mark */}
    <circle cx="280" cy="95" r="18" fill="white" fillOpacity="0.15" />
    <path d="M272 95 L278 101 L290 89" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
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
        flex min-h-[240px] flex-col items-center justify-center gap-6
        bg-gradient-to-br from-blue-700 via-primary to-indigo-900
        px-6 py-10 md:min-h-full md:gap-8 md:px-8 md:py-12
        relative overflow-hidden
      "
    >
      {/* Decorative shapes */}
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5" aria-hidden />
      <div className="absolute -left-10 -bottom-10 h-60 w-60 rounded-full bg-white/5" aria-hidden />
      <div className="absolute right-10 bottom-20 h-32 w-32 rounded-2xl rotate-12 bg-white/5" aria-hidden />
      <div className="absolute left-20 top-16 h-20 w-20 rounded-full bg-white/[0.03]" aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-4 text-center text-white md:gap-6">
        <div className="flex justify-center">{promoIllustration}</div>
        <h2 className="text-xl font-bold leading-tight md:text-2xl lg:text-3xl">{promoTitle}</h2>
        <p className="max-w-md text-sm leading-relaxed opacity-90 md:text-base">{promoText}</p>
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
          <div className="order-first flex flex-1 flex-col lg:w-1/2 lg:order-2">{formPanel}</div>
          <div className="order-2 flex-shrink-0 lg:order-first lg:block lg:w-1/2">
            <div className="hidden lg:block lg:h-full">{promoPanel}</div>
            <div className="bg-gradient-to-r from-blue-700 to-primary py-4 px-4 text-center text-white lg:hidden">
              <p className="text-sm font-semibold">{promoTitle}</p>
              <p className="text-xs opacity-90">{promoText}</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="order-first flex flex-1 flex-col lg:w-1/2">{formPanel}</div>
          <div className="order-2 flex-shrink-0 lg:order-none lg:hidden">
            <div className="bg-gradient-to-r from-blue-700 to-primary py-4 px-4 text-center text-white">
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
