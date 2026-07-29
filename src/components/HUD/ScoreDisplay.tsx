import { useSelector } from 'react-redux'
import { RootState } from '../../store'

export function ScoreDisplay() {
  const score = useSelector((s: RootState) => s.game.score)
  return <div className="hud-score">{score}</div>
}
