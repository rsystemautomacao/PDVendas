import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface ShortcutCardProps {
  to: string
  title: string
  subtitle: string
  shortcut?: string
  icon: ReactNode
  /** Optional placeholder gradient or image area on the right */
  placeholder?: ReactNode
}

export function ShortcutCard({
  to,
  title,
  subtitle,
  shortcut,
  icon,
  placeholder,
}: ShortcutCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-card transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
            {shortcut && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-secondary">
                {shortcut}
              </span>
            )}
          </div>
          {placeholder && (
            <div className="h-12 w-16 overflow-hidden rounded-lg opacity-60 group-hover:opacity-80">
              {placeholder}
            </div>
          )}
        </div>
        <h3 className="mt-3 text-lg font-bold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      </div>
    </Link>
  )
}
