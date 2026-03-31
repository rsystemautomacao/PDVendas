import { type ReactNode } from 'react'
import { BarChart3, Package, DollarSign } from 'lucide-react'

export type PromoAlign = 'left' | 'right'

interface AuthSplitLayoutProps {
  promoTitle: string
  promoText: string
  promoIllustration?: ReactNode
  align?: PromoAlign
  children: ReactNode
}

function FeatureCard({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="group flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-5 py-4 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-lg hover:shadow-white/5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white transition-colors group-hover:bg-white/25">
        {icon}
      </div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="text-[11px] text-white/70">{sub}</p>
    </div>
  )
}

const defaultIllustration = (
  <div className="relative w-full max-w-[420px] mx-auto">
    {/* Main 3D-like isometric illustration */}
    <svg viewBox="0 0 420 260" className="w-full" aria-hidden>
      <defs>
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
          <stop offset="100%" stopColor="white" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="barGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#e9d5ff" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Monitor 1 - Main dashboard */}
      <g transform="translate(80, 20)">
        {/* Monitor body */}
        <rect x="0" y="0" width="180" height="120" rx="12" fill="url(#screenGrad)" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
        {/* Screen content - chart */}
        <rect x="12" y="12" width="156" height="85" rx="6" fill="white" fillOpacity="0.08" />
        {/* Chart bars */}
        <rect x="24" y="72" width="14" height="18" rx="3" fill="url(#barGrad)" opacity="0.7" />
        <rect x="44" y="58" width="14" height="32" rx="3" fill="url(#barGrad)" opacity="0.8" />
        <rect x="64" y="45" width="14" height="45" rx="3" fill="url(#barGrad)" opacity="0.9" />
        <rect x="84" y="52" width="14" height="38" rx="3" fill="url(#barGrad)" opacity="0.8" />
        <rect x="104" y="38" width="14" height="52" rx="3" fill="url(#barGrad)" opacity="1" />
        <rect x="124" y="30" width="14" height="60" rx="3" fill="url(#barGrad)" opacity="0.9" />
        <rect x="144" y="42" width="14" height="48" rx="3" fill="url(#barGrad)" opacity="0.85" />
        {/* Top stat cards inside screen */}
        <rect x="12" y="14" width="45" height="18" rx="4" fill="white" fillOpacity="0.12" />
        <rect x="62" y="14" width="45" height="18" rx="4" fill="white" fillOpacity="0.12" />
        <rect x="112" y="14" width="45" height="18" rx="4" fill="white" fillOpacity="0.12" />
        {/* Monitor stand */}
        <rect x="72" y="120" width="36" height="8" rx="2" fill="white" fillOpacity="0.15" />
        <rect x="60" y="128" width="60" height="5" rx="2.5" fill="white" fillOpacity="0.1" />
      </g>

      {/* Monitor 2 - Side tablet */}
      <g transform="translate(280, 50)">
        <rect x="0" y="0" width="100" height="140" rx="10" fill="url(#screenGrad)" stroke="white" strokeWidth="1.2" strokeOpacity="0.25" />
        <rect x="8" y="8" width="84" height="110" rx="5" fill="white" fillOpacity="0.06" />
        {/* List items */}
        <rect x="14" y="16" width="50" height="5" rx="2" fill="white" fillOpacity="0.25" />
        <rect x="14" y="28" width="70" height="4" rx="2" fill="white" fillOpacity="0.15" />
        <rect x="14" y="38" width="60" height="4" rx="2" fill="white" fillOpacity="0.15" />
        <rect x="14" y="48" width="65" height="4" rx="2" fill="white" fillOpacity="0.15" />
        <rect x="14" y="58" width="55" height="4" rx="2" fill="white" fillOpacity="0.15" />
        {/* Pie chart */}
        <circle cx="50" cy="90" r="18" fill="none" stroke="white" strokeWidth="5" strokeOpacity="0.15" strokeDasharray="60 113" />
        <circle cx="50" cy="90" r="18" fill="none" stroke="white" strokeWidth="5" strokeOpacity="0.35" strokeDasharray="35 113" strokeDashoffset="-60" />
        <circle cx="50" cy="90" r="18" fill="none" stroke="white" strokeWidth="5" strokeOpacity="0.25" strokeDasharray="18 113" strokeDashoffset="-95" />
        {/* Home button */}
        <circle cx="50" cy="130" r="5" fill="white" fillOpacity="0.1" />
      </g>

      {/* Phone */}
      <g transform="translate(20, 80)">
        <rect x="0" y="0" width="55" height="95" rx="8" fill="url(#screenGrad)" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
        <rect x="5" y="10" width="45" height="70" rx="4" fill="white" fillOpacity="0.06" />
        {/* Mini chart on phone */}
        <polyline points="10,60 18,50 26,55 34,40 42,45" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
        {/* Notification dot */}
        <circle cx="45" cy="18" r="4" fill="#a78bfa" opacity="0.8" />
        {/* Phone top */}
        <rect x="18" y="3" width="18" height="3" rx="1.5" fill="white" fillOpacity="0.15" />
      </g>

      {/* Floating elements */}
      {/* Shopping bag */}
      <g transform="translate(240, 10)" opacity="0.6">
        <rect x="0" y="5" width="28" height="24" rx="4" fill="white" fillOpacity="0.15" />
        <path d="M8 12 a6 6 0 0112 0" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
      </g>

      {/* Checkmark badge */}
      <g transform="translate(5, 50)" filter="url(#glow)">
        <circle cx="12" cy="12" r="12" fill="white" fillOpacity="0.12" />
        <path d="M7 12 L10.5 15.5 L17 9" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Dollar coin */}
      <g transform="translate(370, 30)">
        <circle cx="12" cy="12" r="12" fill="white" fillOpacity="0.12" />
        <text x="12" y="16" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="12" fontWeight="bold">$</text>
      </g>

      {/* Connecting dots */}
      <circle cx="270" cy="45" r="2.5" fill="#c084fc" opacity="0.5" />
      <circle cx="75" cy="140" r="2" fill="#e9d5ff" opacity="0.4" />
      <circle cx="380" cy="195" r="3" fill="#a78bfa" opacity="0.3" />
    </svg>
  </div>
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
        bg-gradient-to-br from-indigo-700 via-purple-700 to-violet-900
        px-6 py-10 md:min-h-full md:gap-8 md:px-10 md:py-12
        relative overflow-hidden
      "
    >
      {/* Decorative blurred orbs */}
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" aria-hidden />
      <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-indigo-400/15 blur-3xl" aria-hidden />
      <div className="absolute right-1/4 top-1/3 h-48 w-48 rounded-full bg-violet-300/10 blur-2xl" aria-hidden />
      <div className="absolute left-1/3 bottom-1/4 h-32 w-32 rounded-full bg-fuchsia-400/10 blur-2xl" aria-hidden />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center text-white md:gap-8">
        {/* Illustration */}
        <div className="flex justify-center animate-float">{promoIllustration}</div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-extrabold leading-tight md:text-3xl lg:text-4xl drop-shadow-lg">
            {promoTitle.split(' e ').length > 1 ? (
              <>
                {promoTitle.split(' e ')[0]} e{' '}
                <span className="bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                  {promoTitle.split(' e ')[1]}
                </span>
              </>
            ) : promoTitle}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80 md:text-base">{promoText}</p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          <FeatureCard icon={<BarChart3 size={22} />} title="Vendas" sub="Acompanhe em tempo real" />
          <FeatureCard icon={<Package size={22} />} title="Estoque" sub="Controle total" />
          <FeatureCard icon={<DollarSign size={22} />} title="Financeiro" sub="Lucros e despesas" />
        </div>
      </div>
    </div>
  )

  const formPanel = (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center bg-white px-4 py-8 md:min-h-full md:px-8 md:py-12">
      <div className="w-full max-w-[420px]">{children}</div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {align === 'left' ? (
        <>
          <div className="order-first flex flex-1 flex-col lg:w-1/2 lg:order-2">{formPanel}</div>
          <div className="order-2 flex-shrink-0 lg:order-first lg:block lg:w-1/2">
            <div className="hidden lg:block lg:h-full">{promoPanel}</div>
            <div className="bg-gradient-to-r from-indigo-700 to-purple-700 py-4 px-4 text-center text-white lg:hidden">
              <p className="text-sm font-semibold">{promoTitle}</p>
              <p className="text-xs opacity-90">{promoText}</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="order-first flex flex-1 flex-col lg:w-1/2">{formPanel}</div>
          <div className="order-2 flex-shrink-0 lg:order-none lg:hidden">
            <div className="bg-gradient-to-r from-indigo-700 to-purple-700 py-4 px-4 text-center text-white">
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
