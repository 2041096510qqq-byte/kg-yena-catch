import { useDispatch } from 'react-redux'
import { resetToIdle } from '../../store/slices/gameSlice'
import { ASSETS } from '../../constants/assets'
import './index.less'

const GUIDE_SEEN_KEY = 'guideSeen'

export default function GuidePage() {
  const dispatch = useDispatch()

  function handleConfirm(e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation()
    e.preventDefault()
    localStorage.setItem(GUIDE_SEEN_KEY, 'true')
    dispatch(resetToIdle())
  }

  return (
    <div className="guide-page">
      <img
        className="guide-instruction"
        src={ASSETS.ui.instruction}
        alt="玩法说明"
        draggable={false}
      />
      <button
        className="guide-confirm-btn"
        onClick={handleConfirm}
        onTouchStart={handleConfirm}
      >
        <img src={ASSETS.ui.buttonConfirm} alt="已知晓" />
      </button>
    </div>
  )
}
