import { useDispatch, useSelector } from 'react-redux'
import { startGame } from '../../store/slices/gameSlice'
import { RootState } from '../../store'
import { ASSETS } from '../../constants/assets'
import { ImageButton } from '../../components/ImageButton'
import { useGameAudio } from '../../hooks/useGameAudio'
import './index.less'

export default function HomePage() {
  const dispatch = useDispatch()
  const { totalScore, bestScore } = useSelector((s: RootState) => s.game)
  const { playBGM } = useGameAudio()

  function handleStart() {
    void playBGM()
    dispatch(startGame())
  }

  return (
    <div
      className="home-page"
      style={{ backgroundImage: `url(${ASSETS.background.game})` }}
    >
      <div className="home-shade" aria-hidden="true" />
      <img
        className="home-title-banner"
        src={ASSETS.ui.titleBanner}
        alt="YENA Catch Catch!"
        draggable={false}
      />

      <div className="home-stats">
        <div className="stat-item">
          <span className="stat-label">历史总分</span>
          <span className="stat-value">{totalScore}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">最高分</span>
          <span className="stat-value">{bestScore}</span>
        </div>
      </div>

      <div className="home-actions">
        <div className="skin-control">
          <ImageButton
            className="btn-skin"
            src={ASSETS.ui.buttonSkin}
            label="皮肤选择暂未开放"
            disabled
          />
          <span className="skin-label">皮肤</span>
        </div>
        <div className="start-control">
          <ImageButton
            className="btn-start"
            src={ASSETS.ui.buttonStart}
            label="开始游戏"
            onClick={handleStart}
          />
          <img
            className="start-play-icon"
            src={ASSETS.ui.iconPlay}
            alt=""
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
