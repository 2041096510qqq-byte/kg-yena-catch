import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { clearLastScoreDelta, clearComboTitle } from '../../store/slices/gameSlice'
import { ASSETS } from '../../constants/assets'
import './index.less'

const FEVER_SPARKLES = [
  { left: 6, delay: 0, duration: 1.8 },
  { left: 14, delay: 0.7, duration: 2.2 },
  { left: 23, delay: 1.1, duration: 1.9 },
  { left: 31, delay: 0.3, duration: 2.4 },
  { left: 39, delay: 1.5, duration: 2.1 },
  { left: 47, delay: 0.9, duration: 1.7 },
  { left: 55, delay: 0.1, duration: 2.3 },
  { left: 63, delay: 1.3, duration: 1.8 },
  { left: 71, delay: 0.5, duration: 2.1 },
  { left: 79, delay: 1.7, duration: 2.4 },
  { left: 87, delay: 0.8, duration: 1.9 },
  { left: 94, delay: 1.2, duration: 2.2 },
] as const

export default function FxLayer() {
  const dispatch = useDispatch()
  const { lastScoreDelta, comboTitle, subState } = useSelector((s: RootState) => s.game)
  const floatRef = useRef<HTMLDivElement>(null)
  const comboRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lastScoreDelta) {
      if (floatRef.current) {
        floatRef.current.style.transform = `translate(${lastScoreDelta.x}px, ${lastScoreDelta.y}px)`
        floatRef.current.className = 'float-score-text visible'
        floatRef.current.textContent = lastScoreDelta.value >= 0 ? `+${lastScoreDelta.value}` : String(lastScoreDelta.value)
      }
      const timer = setTimeout(() => {
        dispatch(clearLastScoreDelta())
        if (floatRef.current) floatRef.current.className = 'float-score-text'
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [lastScoreDelta, dispatch])

  useEffect(() => {
    if (comboTitle) {
      if (comboRef.current) {
        comboRef.current.className = 'combo-title-popup visible'
        comboRef.current.textContent = comboTitle
      }
      const timer = setTimeout(() => {
        dispatch(clearComboTitle())
        if (comboRef.current) comboRef.current.className = 'combo-title-popup'
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [comboTitle, dispatch])

  const isFever = subState === 'FEVER'
  const isStunned = subState === 'STUNNED'

  return (
    <div className="fx-layer">
      <div ref={floatRef} className="float-score-text" />
      <div ref={comboRef} className="combo-title-popup" />
      {isFever && (
        <>
          <div className="fever-overlay">FEVER!</div>
          <div className="fever-sparkles" aria-hidden="true">
            {FEVER_SPARKLES.map(sparkle => (
              <img
                key={sparkle.left}
                className="fever-sparkle"
                src={ASSETS.effects.particleSparkle}
                alt=""
                draggable={false}
                style={{
                  left: `${sparkle.left}%`,
                  animationDelay: `${sparkle.delay}s`,
                  animationDuration: `${sparkle.duration}s`,
                }}
              />
            ))}
          </div>
        </>
      )}
      {isStunned && <div className="stun-overlay" />}
    </div>
  )
}
