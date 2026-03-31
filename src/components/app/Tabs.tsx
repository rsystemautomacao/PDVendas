import type { ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  activeId: string
  onSelect: (id: string) => void
}

export function Tabs({ tabs, activeId, onSelect }: TabsProps) {
  return (
    <nav role="tablist" className="flex border-b border-gray-200 bg-gray-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
          onClick={() => onSelect(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
            ${activeId === tab.id
              ? 'border-b-2 border-primary bg-white text-primary'
              : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
