import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { GameState } from '../../constants/enum'
import HUD from '../../components/HUD'
import { YenaStage } from './YenaStage'
import { CoreStage } from './CoreStage'
import { PlayerArea } from './PlayerArea'
import { CountdownOverlay } from './CountdownOverlay'
import FxLayer from '../../components/FxLayer'
import ModalLayer from '../../components/ModalLayer'
import { useGameLoop } from '../../hooks/useGameLoop'
import {
  releaseGameAudioOwner,
  retainGameAudioOwner,
  useGameAudio,
} from '../../hooks/useGameAudio'
import { ASSETS } from '../../constants/assets'
import './index.less'

export default function GamePage() {
  const { gameState } = useSelector((s: RootState) => s.game)
  const { playBGM, pauseBGM, stopBGM } = useGameAudio()
  const {
    startLoop,
    stopLoop,
    resetElapsedTime,
    resetAllTimers,
    clearElements,
    playerXRef,
    elementsRef,
    particlesRef,
    updateParticles,
  } = useGameLoop()

  // Start/stop loop based on game state
  useEffect(() => {
    if (gameState === GameState.COUNTDOWN) {
      resetElapsedTime()
      resetAllTimers()
      clearElements()
      void playBGM()
    } else if (gameState === GameState.PLAYING) {
      startLoop()
      void playBGM()
    } else if (gameState === GameState.PAUSED) {
      stopLoop()
      pauseBGM()
    } else {
      stopLoop()
      stopBGM()
    }
  }, [
    gameState,
    startLoop,
    stopLoop,
    resetElapsedTime,
    resetAllTimers,
    playBGM,
    pauseBGM,
    stopBGM,
  ])

  useEffect(() => {
    retainGameAudioOwner()
    return () => releaseGameAudioOwner()
  }, [])

  return (
    <div
      className="game-page"
      style={{ backgroundImage: `url(${ASSETS.background.game})` }}
    >
      <HUD />
      <YenaStage />
      <CoreStage elementsRef={elementsRef} particlesRef={particlesRef} updateParticles={updateParticles} />
      <PlayerArea playerXRef={playerXRef} />
      <FxLayer />
      <ModalLayer />
      {gameState === GameState.COUNTDOWN && <CountdownOverlay />}
    </div>
  )
}
