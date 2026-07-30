import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { SubState } from '../../constants/enum'
import { ASSETS } from '../../constants/assets'
import { PLAYER_VISUAL_SIZE } from '../../constants/game'
import './PlayerSprite.less'

interface PlayerSpriteProps {
  xRef: React.MutableRefObject<number>
}

export function PlayerSprite({ xRef }: PlayerSpriteProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { subState } = useSelector((s: RootState) => s.game)
  const isStunned = subState === SubState.STUNNED
  const [isHit, setIsHit] = useState(false)

  useEffect(() => {
    let rafId: number
    function update() {
      if (ref.current) {
        const x = xRef.current * 750 - PLAYER_VISUAL_SIZE / 2
        ref.current.style.transform = `translateX(${x}px)`
      }
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [xRef])

  // Expose hit animation trigger
  useEffect(() => {
    ;(window as any).__triggerPlayerHit = () => {
      setIsHit(true)
      setTimeout(() => setIsHit(false), 400)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`player-sprite ${isStunned ? 'stunned' : ''} ${isHit ? 'hit' : ''}`}
      style={{ position: 'absolute', left: 0 }}
    >
      <img
        className="player-img"
        src={ASSETS.characters.player.default}
        alt="player"
        width={PLAYER_VISUAL_SIZE}
        height={PLAYER_VISUAL_SIZE}
        draggable={false}
      />
      {isStunned && (
        <img
          className="stun-star"
          src={ASSETS.effects.stunStar}
          alt=""
          draggable={false}
        />
      )}
    </div>
  )
}
