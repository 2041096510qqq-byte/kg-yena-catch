import { useDispatch } from 'react-redux'
import { resumeGame, resetToIdle } from '../../store/slices/gameSlice'
import { ASSETS } from '../../constants/assets'
import './PauseModal.less'

export default function PauseModal() {
  const dispatch = useDispatch()

  function handleClick(e: React.MouseEvent, action: () => void) {
    e.stopPropagation()
    e.preventDefault()
    action()
  }

  return (
    <div className="modal-panel pause-modal">
      <img
        className="modal-panel-background"
        src={ASSETS.ui.modalBackground}
        alt=""
        draggable={false}
      />
      <div className="modal-panel-content">
        <div className="modal-title">游戏暂停</div>
        <div className="modal-buttons">
          <button
            className="modal-btn"
            onClick={(e) => handleClick(e, () => dispatch(resumeGame()))}
            onTouchStart={(e) => handleClick(e as any, () => dispatch(resumeGame()))}
          >
            <img src={ASSETS.ui.buttonResume} alt="继续游戏" />
          </button>
          <button
            className="modal-btn"
            onClick={(e) => handleClick(e, () => dispatch(resetToIdle()))}
            onTouchStart={(e) => handleClick(e as any, () => dispatch(resetToIdle()))}
          >
            <img src={ASSETS.ui.buttonQuit} alt="退出本局" />
          </button>
        </div>
      </div>
    </div>
  )
}
