import React, { useEffect, useState } from 'react'
import './GameViewport.less'

const DESIGN_WIDTH = 750
const DESIGN_HEIGHT = 1334

interface GameViewportProps {
  children: React.ReactNode
}

export default function GameViewport({ children }: GameViewportProps) {
  const [scale, setScale] = useState(1)
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    function resize() {
      const screenW = window.innerWidth
      const screenH = window.innerHeight
      const scaleX = screenW / DESIGN_WIDTH
      const scaleY = screenH / DESIGN_HEIGHT
      const currentScale = Math.min(scaleX, scaleY)
      setScale(currentScale)
      const scaledHeight = DESIGN_HEIGHT * currentScale
      setOffsetY((screenH - scaledHeight) / 2)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <div className="game-viewport">
      <div
        className="game-stage"
        style={{
          position: 'absolute',
          top: offsetY,
          left: 0,
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
