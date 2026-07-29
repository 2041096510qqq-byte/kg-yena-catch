import { TimerDisplay } from './TimerDisplay'
import { ScoreDisplay } from './ScoreDisplay'
import { ComboDisplay } from './ComboDisplay'
import { FeverGauge } from './FeverGauge'
import './HUD.less'

export default function HUD() {
  return (
    <div className="hud">
      <TimerDisplay />
      <ScoreDisplay />
      <ComboDisplay />
      <FeverGauge />
    </div>
  )
}
