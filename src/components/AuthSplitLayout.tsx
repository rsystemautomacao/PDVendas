import { type ReactNode } from 'react'
import { BarChart3, Package, DollarSign } from 'lucide-react'

export type PromoAlign = 'left' | 'right'

interface AuthSplitLayoutProps {
  promoTitle: string
  promoText: string
  align?: PromoAlign
  videoSrc?: string
  children: ReactNode
}

function FeatureCard({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="group flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 transition-colors hover:bg-white/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white transition-colors group-hover:bg-white/25">
        {icon}
      </div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="text-[11px] text-white/70">{sub}</p>
    </div>
  )
}

export function AuthSplitLayout({
  promoTitle,
  promoText,
  align = 'right',
  videoSrc = '/video_login.mp4',
  children,
}: AuthSplitLayoutProps) {
  const promoPanel = (
    <div className="relative flex min-h-[240px] flex-col items-center justify-center md:min-h-full overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/75 to-violet-900/80" />

      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-10 text-center text-white md:gap-8 md:px-10 md:py-12">
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

        <div className="grid grid-cols-3 gap-3 mt-2">
          <FeatureCard icon={<BarChart3 size={22} />} title="Vendas" sub="Acompanhe em tempo real" />
          <FeatureCard icon={<Package size={22} />} title="Estoque" sub="Controle total" />
          <FeatureCard icon={<DollarSign size={22} />} title="Financeiro" sub="Lucros e despesas" />
        </div>
      </div>
    </div>
  )

  const formPanel = (
    <div className="relative flex min-h-[50vh] flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-8 md:min-h-full md:px-8 md:py-12 overflow-hidden">
      <div className="relative z-10 w-full max-w-[420px]">{children}</div>
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
