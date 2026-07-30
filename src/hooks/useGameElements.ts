import { useRef, useCallback } from 'react'
import { GameElement, ElementType } from '../constants/enum'
import { ELEMENT_SPAWN_Y, ELEMENT_DESPAWN_Y, ELEMENT_SPAWN_MIN_X, ELEMENT_SPAWN_MAX_X } from '../constants/game'
import { LEVELS, SPEED_MULTIPLIERS, BASE_SPEED, SPEED_BOOST_PERIODS, SPEED_BOOST_MULTIPLIER } from '../data/levels'

let idCounter = 0
function genId() {
  return `el_${++idCounter}_${Date.now()}`
}

function weightedRandom(heartProb: number, itemProb: number): ElementType {
  const r = Math.random()
  if (r < heartProb) return ElementType.HEART
  if (r < heartProb + itemProb) return ElementType.ITEM
  return ElementType.BOMB
}

export function useGameElements() {
  const elementsRef = useRef<GameElement[]>([])
  const lastSpawnTimeRef = useRef<number>(0)

  const getCurrentPhaseIndex = useCallback(function (elapsedTime: number): number {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (elapsedTime >= LEVELS[i].startTime) return i
    }
    return 0
  }, [])

  const spawnElement = useCallback(function (
    elapsedTime: number,
    feverActive: boolean,
  ): GameElement | null {
    const phaseIndex = getCurrentPhaseIndex(elapsedTime)
    const phase = LEVELS[phaseIndex]
    if (!phase) return null

    const now = performance.now()
    if (now - lastSpawnTimeRef.current < phase.spawnInterval * 1000) return null
    // Always reset timer to avoid double-spawning in the same frame
    lastSpawnTimeRef.current = now

    let type: ElementType
    if (feverActive) {
      const r = Math.random()
      const heartShare = phase.heartProb / (phase.heartProb + phase.itemProb)
      type = r < heartShare ? ElementType.HEART : ElementType.ITEM
    } else {
      type = weightedRandom(phase.heartProb, phase.itemProb)
    }

    const speedMultiplier = SPEED_MULTIPLIERS[phaseIndex] ?? 1.0
    // Check if in speed boost period
    const inSpeedBoost = SPEED_BOOST_PERIODS.some(
      p => elapsedTime >= p.start && elapsedTime <= p.end
    )
    const finalMultiplier = inSpeedBoost ? speedMultiplier * SPEED_BOOST_MULTIPLIER : speedMultiplier
    // Add ±80% random variation to speed (0.2 to 1.8)
    const randomVariation = 0.2 + Math.random() * 1.6
    const speed = BASE_SPEED * finalMultiplier * randomVariation
    const x = ELEMENT_SPAWN_MIN_X
      + Math.random() * (ELEMENT_SPAWN_MAX_X - ELEMENT_SPAWN_MIN_X)
    const isHeart = type === ElementType.HEART

    return {
      id: genId(),
      type,
      x,
      y: ELEMENT_SPAWN_Y,
      speed,
      swingPhase: isHeart ? Math.random() * Math.PI * 2 : 0,
      swingAmplitude: isHeart ? 0.03 : 0,
      spawnTime: now,
    }
  }, [getCurrentPhaseIndex])

  const updateElements = useCallback(function (elements: GameElement[], deltaTime: number): GameElement[] {
    const dt = deltaTime / 1000
    return elements
      .map(el => {
        const newY = el.y + el.speed * dt
        return { ...el, y: newY }
      })
      .filter(el => el.y < ELEMENT_DESPAWN_Y)
  }, [])

  return { elementsRef, spawnElement, updateElements, getCurrentPhaseIndex, lastSpawnTimeRef }
}
