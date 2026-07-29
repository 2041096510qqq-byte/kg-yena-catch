import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { GameState, SubState } from '../../constants/enum'
import { ASSETS } from '../../constants/assets'
import './YenaStage.less'

export function YenaStage() {
  const { gameState, subState } = useSelector((s: RootState) => s.game)
  const isFever = subState === SubState.FEVER
  const isStunned = subState === SubState.STUNNED

  let imgSrc: string = gameState === GameState.PLAYING
    ? ASSETS.characters.yena.throw
    : ASSETS.characters.yena.normal
  if (isFever) imgSrc = ASSETS.characters.yena.fever
  else if (isStunned) imgSrc = ASSETS.characters.yena.angry

  return (
    <div className="yena-stage">
      <img
        className={`yena-img ${isFever ? 'fever' : ''} ${isStunned ? 'stunned' : ''}`}
        src={imgSrc}
        alt="YENA"
        draggable={false}
      />
    </div>
  )
}
