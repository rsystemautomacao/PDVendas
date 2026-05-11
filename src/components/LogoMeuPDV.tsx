interface LogoMeuPDVProps {
  showSubtitle?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

function CashRegisterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="12" width="20" height="14" rx="2" />
      <line x1="14" y1="26" x2="14" y2="30" />
      <line x1="22" y1="26" x2="22" y2="30" />
      <rect x="6" y="30" width="52" height="16" rx="3" />
      <line x1="14" y1="38" x2="34" y2="38" />
      <circle cx="48" cy="38" r="2.5" />
      <rect x="36" y="20" width="18" height="10" rx="2" />
      <line x1="40" y1="23" x2="40" y2="23.01" strokeWidth="2.5" />
      <line x1="46" y1="23" x2="46" y2="23.01" strokeWidth="2.5" />
      <line x1="50" y1="23" x2="50" y2="23.01" strokeWidth="2.5" />
      <line x1="40" y1="27" x2="40" y2="27.01" strokeWidth="2.5" />
      <line x1="46" y1="27" x2="46" y2="27.01" strokeWidth="2.5" />
      <line x1="50" y1="27" x2="50" y2="27.01" strokeWidth="2.5" />
      <path d="M30 20V8c0-1 .5-2 1.5-2h14c1 0 1.5 1 1.5 2v12" />
      <line x1="34" y1="10" x2="44" y2="10" />
      <line x1="34" y1="13.5" x2="42" y2="13.5" />
      <line x1="34" y1="17" x2="40" y2="17" />
      <path d="M30 8c.5-.5 1 .5 1.5 0s1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0 1 .5 1.5 0" />
      <line x1="6" y1="50" x2="58" y2="50" strokeWidth="2" />
      <line x1="10" y1="46" x2="10" y2="50" />
      <line x1="54" y1="46" x2="54" y2="50" />
    </svg>
  )
}

export function LogoMeuPDV({ showSubtitle = true, className = '', size = 'md' }: LogoMeuPDVProps) {
  const sizes = {
    sm: { box: 'h-12 w-12 rounded-xl', icon: 'h-7 w-7', text: 'text-2xl', sub: 'text-[9px]' },
    md: { box: 'h-16 w-16 rounded-[18px]', icon: 'h-9 w-9', text: 'text-4xl', sub: 'text-[10px]' },
    lg: { box: 'h-[72px] w-[72px] rounded-[20px]', icon: 'h-10 w-10', text: 'text-5xl', sub: 'text-[10px]' },
  }
  const s = sizes[size]

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`flex ${s.box} items-center justify-center bg-gradient-to-br from-primary via-indigo-600 to-violet-700 text-white shadow-2xl shadow-primary/30`} aria-hidden>
        <CashRegisterIcon className={s.icon} />
      </div>
      <h1 className={`${s.text} font-black tracking-tight text-center`}>
        <span className="text-primary">MEU</span>
        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"> PDV</span>
      </h1>
      {showSubtitle && (
        <p className={`${s.sub} font-bold tracking-[0.25em] text-gray-400 uppercase`}>
          Sistema de Gestao Comercial
        </p>
      )}
    </div>
  )
}
