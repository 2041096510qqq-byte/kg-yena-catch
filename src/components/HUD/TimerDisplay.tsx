import { useSelector } from 'react-redux'
import { RootState } from '../../store'

export function TimerDisplay() {
  const remainingTime = useSelector((s: RootState) => s.game.remainingTime)
  const totalSeconds = Math.floor(remainingTime)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const isUrgent = remainingTime <= 10
  return (
    <div className={`hud-timer ${isUrgent ? 'urgent' : ''}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
}
