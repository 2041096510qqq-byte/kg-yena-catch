import { useCallback } from 'react'
import {
  ELEMENT_SIZE,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_MAX_X,
  PLAYER_MIN_X,
  PLAYER_WIDTH,
} from '../constants/game'

const PLAYER_WIDTH_NORM = PLAYER_WIDTH / GAME_WIDTH
const PLAYER_HEIGHT_NORM = PLAYER_HEIGHT / GAME_HEIGHT
const ELEMENT_WIDTH_NORM = ELEMENT_SIZE / GAME_WIDTH
const ELEMENT_HEIGHT_NORM = ELEMENT_SIZE / GAME_HEIGHT
const PLAYER_Y_NORM = 0.88

export function useCollision() {
  const checkCollision = useCallback(function (
    playerXNorm: number,
    elementXNorm: number,
    elementYNorm: number,
  ): boolean {
    // Clamp player x to bounds
    const px = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X, playerXNorm))

    // Player bounding box
    const pLeft = px - PLAYER_WIDTH_NORM / 2
    const pRight = px + PLAYER_WIDTH_NORM / 2
    const pTop = PLAYER_Y_NORM - PLAYER_HEIGHT_NORM / 2
    const pBottom = PLAYER_Y_NORM + PLAYER_HEIGHT_NORM / 2

    // Element bounding box
    const eLeft = elementXNorm - ELEMENT_WIDTH_NORM / 2
    const eRight = elementXNorm + ELEMENT_WIDTH_NORM / 2
    const eTop = elementYNorm - ELEMENT_HEIGHT_NORM / 2
    const eBottom = elementYNorm + ELEMENT_HEIGHT_NORM / 2

    // Simple AABB overlap
    const overlapW = Math.max(0, Math.min(pRight, eRight) - Math.max(pLeft, eLeft))
    const overlapH = Math.max(0, Math.min(pBottom, eBottom) - Math.max(pTop, eTop))

    return overlapW > 0 && overlapH > 0
  }, [])

  return { checkCollision }
}
