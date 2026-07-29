import type { MutableRefObject } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { SubState } from '../../constants/enum'
import { ASSETS } from '../../constants/assets'
import { pauseGame } from '../../store/slices/gameSlice'
import { ImageButton } from '../../components/ImageButton'
import { PlayerSprite } from './PlayerSprite'
import './PlayerArea.less'

interface PlayerAreaProps {
  playerXRef: MutableRefObject<number>
}

export function PlayerArea({ playerXRef }: PlayerAreaProps) {
  const dispatch = useDispatch()
  const { subState } = useSelector((s: RootState) => s.game)

  return (
    <div className="player-area">
      <ImageButton
        className="pause-btn"
        src={ASSETS.ui.buttonPause}
        label="暂停游戏"
        onClick={() => dispatch(pauseGame())}
        disabled={subState === SubState.STUNNED}
      />
      <PlayerSprite xRef={playerXRef} />
    </div>
  )
}
