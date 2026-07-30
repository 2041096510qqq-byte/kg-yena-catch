import { useRef, useEffect } from 'react'
import { ElementType, GameState } from '../../constants/enum'
import type { GameElement, Particle } from '../../constants/enum'
import { ASSETS } from '../../constants/assets'
import './CoreStage.less'

interface CoreStageProps {
  elementsRef: React.MutableRefObject<GameElement[]>
  particlesRef: React.MutableRefObject<Particle[]>
  updateParticles: (dt: number) => Particle[]
  gameState: GameState
}

const ELEMENT_IMGS: Record<ElementType, string> = {
  [ElementType.HEART]: ASSETS.elements.heart,
  [ElementType.ITEM]: ASSETS.elements.item,
  [ElementType.BOMB]: ASSETS.elements.bomb,
}

const PARTICLE_IMGS: Record<Particle['shape'], string> = {
  circle: ASSETS.effects.particleHeart,
  star: ASSETS.effects.particleStar,
  smoke: ASSETS.effects.particleSmoke,
}

export function CoreStage({ elementsRef, particlesRef, updateParticles, gameState }: CoreStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const elementNodesRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const particleNodesRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const lastTimeRef = useRef<number>(performance.now())
  const prevGameStateRef = useRef(gameState)

  // Clear DOM nodes and reset timer when game restarts
  useEffect(() => {
    if (prevGameStateRef.current !== GameState.IDLE && gameState === GameState.COUNTDOWN) {
      // Game is restarting, clear DOM nodes
      elementNodesRef.current.forEach(node => node.remove())
      elementNodesRef.current.clear()
      particleNodesRef.current.forEach(node => node.remove())
      particleNodesRef.current.clear()
      lastTimeRef.current = performance.now()
    }
    prevGameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    let rafId: number

    function render() {
      const now = performance.now()
      const deltaTime = now - lastTimeRef.current
      lastTimeRef.current = now

      particlesRef.current = updateParticles(deltaTime)

      const currentIds = new Set(elementsRef.current.map(el => el.id))
      elementNodesRef.current.forEach((node, id) => {
        if (!currentIds.has(id)) {
          node.style.display = 'none'
        }
      })

      elementsRef.current.forEach(el => {
        let node = elementNodesRef.current.get(el.id)
        if (!node && containerRef.current) {
          node = document.createElement('div')
          node.className = 'game-element'
          const img = document.createElement('img')
          img.src = ELEMENT_IMGS[el.type]
          img.width = 84
          img.height = 84
          img.draggable = false
          img.style.pointerEvents = 'none'
          node.appendChild(img)
          containerRef.current.appendChild(node)
          elementNodesRef.current.set(el.id, node)
        }
        if (node) {
          node.style.transform = `translate(${el.x * 750 - 42}px, ${el.y * 1334 - 42}px)`
          node.className = `game-element element-${el.type}`
          node.style.display = el.y >= 1.1 ? 'none' : 'block'
        }
      })

      const currentPids = new Set(particlesRef.current.map(p => p.id))
      particleNodesRef.current.forEach((node, id) => {
        if (!currentPids.has(id)) {
          node.style.display = 'none'
        }
      })

      particlesRef.current.forEach(p => {
        let node = particleNodesRef.current.get(p.id)
        if (!node && containerRef.current) {
          node = document.createElement('div')
          node.className = 'game-particle'
          containerRef.current.appendChild(node)
          particleNodesRef.current.set(p.id, node)
        }
        if (node) {
          node.style.transform = `translate(${p.x * 750 - p.size / 2}px, ${p.y * 1334 - p.size / 2}px)`
          node.style.opacity = String(Math.max(0, p.life / p.maxLife))
          node.style.backgroundImage = `url(${PARTICLE_IMGS[p.shape]})`
          node.style.width = `${p.size}px`
          node.style.height = `${p.size}px`
          node.style.display = p.life <= 0 ? 'none' : 'block'
        }
      })

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafId)
  }, [elementsRef, particlesRef, updateParticles])

  return <div ref={containerRef} className="core-stage" />
}
