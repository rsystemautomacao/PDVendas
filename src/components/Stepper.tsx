import { Check } from 'lucide-react'

interface StepperProps {
  steps: number
  activeStep: number
  /** steps concluídos (com check); normalmente activeStep - 1 */
  completedSteps?: number
}

export function Stepper({ steps, activeStep, completedSteps = Math.max(0, activeStep - 1) }: StepperProps) {
  return (
    <nav aria-label="Progresso do cadastro" className="w-full">
      <ol className="flex items-center justify-between gap-0" role="list">
        {Array.from({ length: steps }, (_, i) => {
          const stepNum = i + 1
          const isCompleted = stepNum <= completedSteps
          const isActive = stepNum === activeStep
          const isPast = stepNum < activeStep
          return (
            <li
              key={stepNum}
              className="flex flex-1 items-center last:flex-none"
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="flex flex-col items-center">
                <span
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold
                    transition-colors
                    ${isCompleted ? 'border-primary bg-primary text-white' : ''}
                    ${isActive && !isCompleted ? 'border-primary bg-primary text-white' : ''}
                    ${!isActive && !isCompleted ? 'border-gray-300 bg-white text-text-muted' : ''}
                  `}
                  aria-hidden
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : stepNum}
                </span>
                <span className="sr-only">
                  {isCompleted ? `Etapa ${stepNum} concluída` : isActive ? `Etapa ${stepNum} atual` : `Etapa ${stepNum}`}
                </span>
              </div>
              {i < steps - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 md:mx-2 ${isPast || isCompleted ? 'bg-primary' : 'bg-gray-200'}`}
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
