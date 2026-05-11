import { type ReactNode } from 'react'
import { ShoppingCart, BarChart3, Package, Users, CreditCard, Shield, RefreshCw, Headphones } from 'lucide-react'

export type PromoAlign = 'left' | 'right'

interface AuthSplitLayoutProps {
  promoTitle: string
  promoText: string
  align?: PromoAlign
  videoSrc?: string
  children: ReactNode
}

function FeatureItem({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-[11px] text-white/60">{sub}</p>
      </div>
    </div>
  )
}

function BottomFeature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
        {icon}
      </div>
      <p className="text-[10px] font-semibold text-white/70 text-center leading-tight">{label}</p>
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

      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/85 via-slate-900/80 to-indigo-900/90" />

      <div className="relative z-10 flex h-full flex-col justify-between px-8 py-10 text-white md:px-12 md:py-14 w-full max-w-lg mx-auto">
        {/* Top: Brand + Title */}
        <div>
          <div className="flex items-center gap-2.5 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-tight">
              MEU <span className="text-indigo-300">PDV</span>
            </span>
          </div>

          <h2 className="text-2xl font-extrabold leading-tight md:text-3xl lg:text-[2.5rem] lg:leading-[1.15]">
            {promoTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60 md:text-base max-w-sm">{promoText}</p>
        </div>

        {/* Middle: Features */}
        <div className="my-8 space-y-4">
          <FeatureItem icon={<ShoppingCart size={18} className="text-indigo-300" />} title="Vendas rapidas e seguras" sub="PDV moderno e intuitivo" />
          <FeatureItem icon={<BarChart3 size={18} className="text-emerald-300" />} title="Gestao inteligente" sub="Relatorios e graficos em tempo real" />
          <FeatureItem icon={<Package size={18} className="text-amber-300" />} title="Controle total" sub="Estoque, produtos e clientes" />
          <FeatureItem icon={<Users size={18} className="text-sky-300" />} title="Multi-usuario" sub="Gerencie sua equipe com permissoes" />
        </div>

        {/* Bottom: Trust badges */}
        <div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mb-6" />
          <div className="grid grid-cols-4 gap-4">
            <BottomFeature icon={<CreditCard size={16} className="text-white/70" />} label="Aceita todos os cartoes" />
            <BottomFeature icon={<Shield size={16} className="text-white/70" />} label="Seguranca e confiabilidade" />
            <BottomFeature icon={<RefreshCw size={16} className="text-white/70" />} label="Sincronizacao em tempo real" />
            <BottomFeature icon={<Headphones size={16} className="text-white/70" />} label="Suporte que te acompanha" />
          </div>
        </div>
      </div>
    </div>
  )

  const formPanel = (
    <div className="relative flex min-h-[50vh] flex-1 flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-8 md:min-h-full md:px-8 md:py-12 overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" aria-hidden />
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
