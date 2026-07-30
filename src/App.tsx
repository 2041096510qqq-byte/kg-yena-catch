import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import GameViewport from './components/GameViewport'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import GuidePage from './pages/GuidePage'
import { RootState } from './store'
import { GameState } from './constants/enum'

const GUIDE_SEEN_KEY = 'guideSeen'

export default function App() {
  const gameState = useSelector((s: RootState) => s.game.gameState)
  const [showGuideFirst, setShowGuideFirst] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(GUIDE_SEEN_KEY)
    if (!seen) {
      setShowGuideFirst(true)
    }
  }, [])

  return (
    <GameViewport>
      {showGuideFirst && gameState === GameState.IDLE && <GuidePage />}
      {!showGuideFirst && gameState === GameState.IDLE && <HomePage />}
      {gameState !== GameState.IDLE && gameState !== GameState.GUIDE && <GamePage />}
    </GameViewport>
  )
}
