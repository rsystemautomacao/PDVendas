import { useState, useEffect, useRef, useCallback } from 'react'

export type BearState = 'idle' | 'watching' | 'hiding' | 'peeking'

interface LoginBearProps {
  state: BearState
  /** 0 = looking left, 0.5 = center, 1 = looking right */
  lookAt: number
}

export function LoginBear({ state, lookAt }: LoginBearProps) {
  const [blinking, setBlinking] = useState(false)
  const blinkTimer = useRef<ReturnType<typeof setTimeout>>()

  // Random blinking
  useEffect(() => {
    if (state === 'hiding') return

    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 4000
      blinkTimer.current = setTimeout(() => {
        setBlinking(true)
        setTimeout(() => setBlinking(false), 150)
        scheduleBlink()
      }, delay)
    }
    scheduleBlink()
    return () => { if (blinkTimer.current) clearTimeout(blinkTimer.current) }
  }, [state])

  // Eye position based on lookAt (clamped)
  const eyeX = (Math.max(0, Math.min(1, lookAt)) - 0.5) * 6
  const eyeY = Math.abs(lookAt - 0.5) * 1.5

  const isHiding = state === 'hiding'
  const isPeeking = state === 'peeking'
  const showEyes = !isHiding || isPeeking
  const eyesClosed = blinking && !isHiding

  // Paw position for covering eyes
  const leftPawY = isHiding ? -18 : 10
  const rightPawY = isHiding ? -18 : 10
  const leftPawX = isHiding ? 6 : 0
  const rightPawX = isHiding ? -6 : 0

  return (
    <div className="flex justify-center select-none" aria-hidden="true">
      <svg
        viewBox="0 0 120 100"
        className="w-28 h-24 drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(99,102,241,0.15))' }}
      >
        {/* === EARS === */}
        {/* Left ear */}
        <circle cx="30" cy="18" r="16" fill="#c7a882" />
        <circle cx="30" cy="18" r="10" fill="#e8c9a0" />
        {/* Right ear */}
        <circle cx="90" cy="18" r="16" fill="#c7a882" />
        <circle cx="90" cy="18" r="10" fill="#e8c9a0" />

        {/* === HEAD === */}
        <ellipse cx="60" cy="48" rx="38" ry="34" fill="#d4a96a" />
        {/* Face lighter area */}
        <ellipse cx="60" cy="54" rx="28" ry="24" fill="#e8c9a0" />

        {/* === EYES === */}
        <g style={{ transition: 'opacity 0.2s ease' }} opacity={showEyes ? 1 : 0}>
          {/* Left eye */}
          <g style={{ transition: 'transform 0.15s ease-out' }}
             transform={`translate(${eyeX}, ${eyeY})`}>
            {/* Eye white */}
            <ellipse cx="45" cy="42" rx="8" ry={eyesClosed ? 0.5 : 7} fill="white"
              style={{ transition: 'ry 0.1s ease' }} />
            {/* Pupil */}
            {!eyesClosed && (
              <g>
                <circle cx={45 + eyeX * 0.4} cy={42 + eyeY * 0.3} r="3.5" fill="#2d1b0e" />
                <circle cx={44 + eyeX * 0.4} cy={40.5 + eyeY * 0.3} r="1.2" fill="white" />
              </g>
            )}
          </g>

          {/* Right eye */}
          <g style={{ transition: 'transform 0.15s ease-out' }}
             transform={`translate(${eyeX}, ${eyeY})`}>
            {/* Peeking: right eye half closed */}
            <ellipse cx="75" cy="42" rx="8"
              ry={isPeeking ? 3.5 : (eyesClosed ? 0.5 : 7)}
              fill="white"
              style={{ transition: 'ry 0.2s ease' }} />
            {!eyesClosed && (
              <g>
                <circle cx={75 + eyeX * 0.4} cy={isPeeking ? 43 : 42 + eyeY * 0.3} r={isPeeking ? 2.5 : 3.5} fill="#2d1b0e" />
                <circle cx={74 + eyeX * 0.4} cy={isPeeking ? 41.5 : 40.5 + eyeY * 0.3} r={isPeeking ? 0.8 : 1.2} fill="white" />
              </g>
            )}
            {/* Peeking eyelid on right eye */}
            {isPeeking && (
              <ellipse cx="75" cy="39" rx="8.5" ry="4" fill="#d4a96a"
                style={{ transition: 'all 0.2s ease' }} />
            )}
          </g>

          {/* Eyebrows - subtle */}
          <path d={`M37 ${isHiding ? 33 : 34} Q45 ${isHiding ? 30 : 31} 53 ${isHiding ? 33 : 34}`}
            fill="none" stroke="#b08850" strokeWidth="1.2" strokeLinecap="round"
            style={{ transition: 'all 0.3s ease' }} />
          <path d={`M67 ${isHiding ? 33 : 34} Q75 ${isHiding ? 30 : 31} 83 ${isHiding ? 33 : 34}`}
            fill="none" stroke="#b08850" strokeWidth="1.2" strokeLinecap="round"
            style={{ transition: 'all 0.3s ease' }} />
        </g>

        {/* === NOSE === */}
        <ellipse cx="60" cy="55" rx="6" ry="4" fill="#2d1b0e" />
        {/* Nose shine */}
        <ellipse cx="58" cy="53.5" rx="2" ry="1.2" fill="#5a3a1e" opacity="0.5" />

        {/* === MOUTH === */}
        <path
          d={state === 'idle' || isPeeking
            ? 'M54 60 Q60 65 66 60'  // smile
            : isHiding
              ? 'M55 61 Q60 63 65 61' // small neutral
              : 'M54 60 Q60 64 66 60'  // slight smile when watching
          }
          fill="none" stroke="#2d1b0e" strokeWidth="1.5" strokeLinecap="round"
          style={{ transition: 'all 0.3s ease' }}
        />

        {/* === CHEEK BLUSH === */}
        <ellipse cx="35" cy="55" rx="6" ry="3.5" fill="#e8a0a0" opacity="0.25" />
        <ellipse cx="85" cy="55" rx="6" ry="3.5" fill="#e8a0a0" opacity="0.25" />

        {/* === PAWS (cover eyes when hiding) === */}
        <g style={{
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: `translate(${leftPawX}px, ${leftPawY}px)`,
        }}>
          {/* Left paw */}
          <ellipse cx="38" cy="78" rx="14" ry="10" fill="#d4a96a" />
          {/* Paw pads */}
          <ellipse cx="38" cy="78" rx="9" ry="6" fill="#e8c9a0" />
          <circle cx="33" cy="74" r="2.5" fill="#e8c9a0" />
          <circle cx="38" cy="72" r="2.5" fill="#e8c9a0" />
          <circle cx="43" cy="74" r="2.5" fill="#e8c9a0" />
        </g>
        <g style={{
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: `translate(${rightPawX}px, ${rightPawY}px)`,
        }}>
          {/* Right paw */}
          <ellipse cx="82" cy="78" rx="14" ry="10" fill="#d4a96a" />
          {/* Paw pads */}
          <ellipse cx="82" cy="78" rx="9" ry="6" fill="#e8c9a0" />
          <circle cx="77" cy="74" r="2.5" fill="#e8c9a0" />
          <circle cx="82" cy="72" r="2.5" fill="#e8c9a0" />
          <circle cx="87" cy="74" r="2.5" fill="#e8c9a0" />
        </g>
      </svg>
    </div>
  )
}

/**
 * Hook to manage bear state based on form interactions.
 * Returns props for LoginBear + handlers to attach to form fields.
 */
export function useLoginBear() {
  const [bearState, setBearState] = useState<BearState>('idle')
  const [lookAt, setLookAt] = useState(0.5)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const focusedField = useRef<'email' | 'password' | null>(null)

  const onEmailFocus = useCallback(() => {
    focusedField.current = 'email'
    setBearState('watching')
  }, [])

  const onEmailChange = useCallback((value: string) => {
    // Map cursor position roughly: short text = left, long = right
    const progress = Math.min(value.length / 25, 1)
    setLookAt(0.15 + progress * 0.7)
  }, [])

  const onPasswordFocus = useCallback(() => {
    focusedField.current = 'password'
    if (passwordVisible) {
      setBearState('peeking')
    } else {
      setBearState('hiding')
    }
  }, [passwordVisible])

  const onFieldBlur = useCallback(() => {
    // Small delay to check if focus moved to the other field
    setTimeout(() => {
      if (document.activeElement !== emailRef.current &&
          document.activeElement !== passwordRef.current) {
        focusedField.current = null
        setBearState('idle')
        setLookAt(0.5)
      }
    }, 100)
  }, [])

  const togglePasswordVisibility = useCallback(() => {
    setPasswordVisible(prev => {
      const next = !prev
      if (focusedField.current === 'password') {
        setBearState(next ? 'peeking' : 'hiding')
      }
      return next
    })
  }, [])

  return {
    bearState,
    lookAt,
    passwordVisible,
    emailRef,
    passwordRef,
    onEmailFocus,
    onEmailChange,
    onPasswordFocus,
    onFieldBlur,
    togglePasswordVisibility,
  }
}
