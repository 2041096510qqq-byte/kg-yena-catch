import { useDispatch } from 'react-redux'
import { countdownEnd } from '../../store/slices/gameSlice'
import { useCountdown } from '../../hooks/useCountdown'
import './CountdownOverlay.less'

export function CountdownOverlay() {
  const dispatch = useDispatch()

  const { count, isCounting } = useCountdown(3, () => {
    dispatch(countdownEnd())
  })

  if (!isCounting) return null

  return (
    <div className="countdown-overlay">
      <div className="countdown-number" key={count}>
        {count}
      </div>
    </div>
  )
}
