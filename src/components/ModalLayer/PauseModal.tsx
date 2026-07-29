import { useDispatch } from 'react-redux'
import { resumeGame, resetToIdle } from '../../store/slices/gameSlice'
import { ASSETS } from '../../constants/assets'
import { ImageButton } from '../ImageButton'
import './PauseModal.less'

export default function PauseModal() {
  const dispatch = useDispatch()

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
          <ImageButton
            className="modal-btn"
            src={ASSETS.ui.buttonResume}
            label="继续游戏"
            onClick={() => dispatch(resumeGame())}
          />
          <ImageButton
            className="modal-btn"
            src={ASSETS.ui.buttonQuit}
            label="退出本局"
            onClick={() => dispatch(resetToIdle())}
          />
        </div>
      </div>
    </div>
  )
}
