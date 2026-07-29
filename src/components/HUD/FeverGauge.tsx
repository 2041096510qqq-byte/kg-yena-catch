import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { FEVER_MAX } from '../../constants/game'
import { ASSETS } from '../../constants/assets'

export function FeverGauge() {
  const feverGauge = useSelector((s: RootState) => s.game.feverGauge)
  const feverCount = useSelector((s: RootState) => s.game.feverCount)
  const cells = Array.from({ length: FEVER_MAX }, (_, i) => i < feverGauge)
  return (
    <div className="hud-fever">
      <span className="fever-label">FEVER</span>
      <div
        className="fever-cells"
        role="progressbar"
        aria-label="Fever 能量"
        aria-valuemin={0}
        aria-valuemax={FEVER_MAX}
        aria-valuenow={feverGauge}
      >
        {cells.map((filled, i) => (
          <img
            key={i}
            className="fever-cell"
            src={filled ? ASSETS.ui.feverFull : ASSETS.ui.feverEmpty}
            alt=""
            draggable={false}
          />
        ))}
      </div>
      {feverCount > 0 && <span className="fever-count">×{feverCount}</span>}
    </div>
  )
}
