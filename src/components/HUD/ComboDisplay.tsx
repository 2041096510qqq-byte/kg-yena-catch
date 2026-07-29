import { useSelector } from 'react-redux'
import { RootState } from '../../store'

export function ComboDisplay() {
  const combo = useSelector((s: RootState) => s.game.combo)
  if (combo === 0) return null
  return <div className="hud-combo">🔥{combo} Combo</div>
}
