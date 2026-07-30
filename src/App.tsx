import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import GameViewport from './components/GameViewport'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import GuidePage from './pages/GuidePage'
import { RootState } from './store'
import { GameState } from './constants/enum'
import { showGuide } from './store/slices/gameSlice'

export default function App() {
  const dispatch = useDispatch()
  const gameState = useSelector((s: RootState) => s.game.gameState)
  const gameSession = useSelector((s: RootState) => s.game.gameSession)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      dispatch(showGuide())
    }
  }, [dispatch])

  return (
    <GameViewport>
      {gameState === GameState.GUIDE && <GuidePage />}
      {gameState === GameState.IDLE && <HomePage />}
      {gameState !== GameState.IDLE && gameState !== GameState.GUIDE && (
        <GamePage key={gameSession} />
      )}
    </GameViewport>
  )
}
