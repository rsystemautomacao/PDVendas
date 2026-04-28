import { useState, useEffect } from 'react'
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, Lightbulb,
  type LucideIcon,
} from 'lucide-react'

export interface TutorialStep {
  titulo: string
  descricao: string
  icon: LucideIcon
  iconColor?: string
  dica?: string
  itens?: string[]
}

interface TutorialModalProps {
  id: string
  titulo: string
  subtitulo?: string
  steps: TutorialStep[]
}

function getStorageKey(id: string) {
  return `meupdv_tutorial_${id}_hidden`
}

export function useTutorial(id: string) {
  const key = getStorageKey(id)
  const [visible, setVisible] = useState(() => {
    return localStorage.getItem(key) !== 'true'
  })

  const hide = (permanently: boolean) => {
    if (permanently) {
      localStorage.setItem(key, 'true')
    }
    setVisible(false)
  }

  const show = () => setVisible(true)

  return { visible, hide, show }
}

export function TutorialModal({ id, titulo, subtitulo, steps }: TutorialModalProps) {
  const { visible, hide } = useTutorial(id)
  const [step, setStep] = useState(0)
  const [naoMostrar, setNaoMostrar] = useState(false)

  // Reset step when modal opens
  useEffect(() => {
    if (visible) setStep(0)
  }, [visible])

  if (!visible) return null

  const current = steps[step]
  const isLast = step === steps.length - 1
  const isFirst = step === 0
  const Icon = current.icon
  const iconColor = current.iconColor || 'text-primary'
  const iconBg = current.iconColor?.replace('text-', 'bg-').replace('500', '100') || 'bg-primary/10'

  const handleClose = () => {
    hide(naoMostrar)
  }

  const handleFinish = () => {
    hide(naoMostrar)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary to-violet-600 px-6 py-5 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
            <Lightbulb className="h-3.5 w-3.5" />
            Tutorial
          </div>
          <h2 className="text-lg font-bold">{titulo}</h2>
          {subtitulo && <p className="text-white/80 text-sm mt-0.5">{subtitulo}</p>}

          {/* Step indicator dots */}
          <div className="flex gap-1.5 mt-3">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-white' : i < step ? 'w-1.5 bg-white/60' : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Step counter */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Passo {step + 1} de {steps.length}
            </span>
          </div>

          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center`}>
              <Icon className={`h-7 w-7 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-800 mb-1">{current.titulo}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{current.descricao}</p>
            </div>
          </div>

          {/* Items list */}
          {current.itens && current.itens.length > 0 && (
            <div className="ml-[4.5rem] space-y-1.5 mb-4">
              {current.itens.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tip */}
          {current.dica && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-3">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <span className="font-semibold">Dica:</span> {current.dica}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            {/* Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={naoMostrar}
                onChange={e => setNaoMostrar(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
              />
              <span className="text-xs text-gray-500">Nao mostrar novamente</span>
            </label>

            {/* Navigation */}
            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
              )}
              {isLast ? (
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-violet-600 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.97]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Entendi!
                </button>
              ) : (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-violet-600 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.97]"
                >
                  Proximo
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
