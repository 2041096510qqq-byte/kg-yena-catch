import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { GameState } from '../../constants/enum'
import PauseModal from './PauseModal'
import ResultModal from './ResultModal'
import './index.less'

export default function ModalLayer() {
  const { gameState } = useSelector((s: RootState) => s.game)

  if (gameState !== GameState.PAUSED && gameState !== GameState.RESULT) return null

  return (
    <div className="modal-layer">
      <div className="modal-backdrop" />
      {gameState === GameState.PAUSED && <PauseModal />}
      {gameState === GameState.RESULT && <ResultModal />}
    </div>
  )
}
