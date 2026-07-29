import type { MutableRefObject } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { SubState } from '../../constants/enum'
import { ASSETS } from '../../constants/assets'
import { pauseGame } from '../../store/slices/gameSlice'
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
      <button
        className="pause-btn"
        onClick={(e) => {
          e.stopPropagation()
          dispatch(pauseGame())
        }}
        disabled={subState === SubState.STUNNED}
      >
        <img src={ASSETS.ui.buttonPause} alt="暂停" />
      </button>
      <PlayerSprite xRef={playerXRef} />
    </div>
  )
}
