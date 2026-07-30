import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import './LivesDisplay.less'

export function LivesDisplay() {
  const { lives } = useSelector((s: RootState) => s.game)

  return (
    <div className="lives-display">
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className={`life-icon ${i < lives ? 'active' : 'lost'}`}>♥</span>
      ))}
    </div>
  )
}
