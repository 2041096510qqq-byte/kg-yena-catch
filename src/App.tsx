import { useSelector } from 'react-redux'
import GameViewport from './components/GameViewport'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import GuidePage from './pages/GuidePage'
import { RootState } from './store'
import { GameState } from './constants/enum'

export default function App() {
  const gameState = useSelector((s: RootState) => s.game.gameState)

  return (
    <GameViewport>
      {gameState === GameState.GUIDE && <GuidePage />}
      {gameState === GameState.IDLE && <HomePage />}
      {gameState !== GameState.IDLE && gameState !== GameState.GUIDE && <GamePage />}
    </GameViewport>
  )
}
