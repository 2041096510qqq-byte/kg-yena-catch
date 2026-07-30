import { useEffect, useRef, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { store } from '../store'
import {
  tick, endGame, addScore, setCombo, incrementFeverGauge,
  triggerStun, endStun, endInvincible, loseLife, recordCollect,
  showComboTitle, endFever,
} from '../store/slices/gameSlice'
import { GameState, SubState, ElementType } from '../constants/enum'
import { GameElement } from '../constants/enum'
import { useGameInput } from './useGameInput'
import { useGameElements } from './useGameElements'
import { useCollision } from './useCollision'
import { useParticles } from './useParticles'
import { useGameAudio } from './useGameAudio'
import {
  GAME_DURATION, COMBO_THRESHOLDS,
  PLAYER_MIN_X, PLAYER_MAX_X,
  FEVER_DURATION, STUN_DURATION, INVINCIBLE_DURATION,
} from '../constants/game'

export function useGameLoop() {
  const dispatch = useDispatch()

  const { frameInputRef } = useGameInput()
  const { elementsRef, spawnElement, updateElements, clearElements } = useGameElements()
  const { checkCollision } = useCollision()
  const { particlesRef, spawnParticles, updateParticles } = useParticles()
  const { playSFX } = useGameAudio()

  const rafIdRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const playerXRef = useRef<number>(0.5)
  const targetPlayerXRef = useRef<number>(0.5)
  const feverTimerRef = useRef<number>(0)
  const stunTimerRef = useRef<number>(0)
  const invincibleTimerRef = useRef<number>(0)
  const comboRef = useRef<number>(0)
  const comboTitleShownRef = useRef<number>(0)
  const lastSecondRef = useRef<number>(-1)
  const elapsedTimeRef = useRef<number>(0)
  const isRunningRef = useRef<boolean>(false)
  const wasStunnedRef = useRef<boolean>(false)

  const stopLoop = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = 0
    isRunningRef.current = false
  }, [])

  const resetElapsedTime = useCallback(() => {
    elapsedTimeRef.current = 0
    lastSecondRef.current = -1
    lastTimeRef.current = performance.now()
  }, [])

  const resetAllTimers = useCallback(() => {
    feverTimerRef.current = 0
    stunTimerRef.current = 0
    invincibleTimerRef.current = 0
    comboRef.current = 0
    comboTitleShownRef.current = 0
    wasStunnedRef.current = false
  }, [])

  const startLoop = useCallback(() => {
    if (isRunningRef.current) return
    isRunningRef.current = true
    lastTimeRef.current = performance.now()
    rafIdRef.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    return () => stopLoop()
  }, [stopLoop])

  function handleCollision(el: GameElement) {
    const screenX = el.x * 750
    const screenY = el.y * 1334
    const particleY = Math.max(0.5, el.y - 0.08)

    if (el.type === ElementType.BOMB) {
      if (invincibleTimerRef.current <= 0 && store.getState().game.subState !== SubState.STUNNED) {
        playSFX('bomb')
        playSFX('stun')
        dispatch(recordCollect(ElementType.BOMB))
        dispatch(loseLife())
        // Trigger hit animation
        ;(window as any).__triggerPlayerHit?.()
        // Only trigger stun if game is still playing (lives > 0)
        if (store.getState().game.gameState === GameState.PLAYING) {
          dispatch(addScore({ delta: -2, x: screenX, y: screenY }))
          comboRef.current = 0
          dispatch(setCombo(0))
          comboTitleShownRef.current = 0
          dispatch(triggerStun())
          stunTimerRef.current = STUN_DURATION
          invincibleTimerRef.current = INVINCIBLE_DURATION
          spawnParticles('bomb', el.x, particleY)
        }
      }
    } else if (el.type === ElementType.HEART) {
      playSFX('heart')
      dispatch(addScore({ delta: 1, x: screenX, y: screenY }))
      comboRef.current += 1
      dispatch(setCombo(comboRef.current))
      checkComboTitle()
      dispatch(recordCollect(ElementType.HEART))
      spawnParticles('heart', el.x, particleY)
    } else if (el.type === ElementType.ITEM) {
      playSFX('item')
      dispatch(addScore({ delta: 5, x: screenX, y: screenY }))
      comboRef.current += 1
      dispatch(setCombo(comboRef.current))
      checkComboTitle()
      const wasFever = store.getState().game.subState === SubState.FEVER
      dispatch(incrementFeverGauge())
      if (!wasFever && store.getState().game.subState === SubState.FEVER) {
        playSFX('fever')
      }
      dispatch(recordCollect(ElementType.ITEM))
      spawnParticles('item', el.x, particleY)
    }
  }

  function checkComboTitle() {
    for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
      const t = COMBO_THRESHOLDS[i]
      if (comboRef.current >= t.minCombo && comboTitleShownRef.current < t.level) {
        comboTitleShownRef.current = t.level
        dispatch(showComboTitle(t.title))
        playSFX('combo')
        return
      }
    }
  }

  function loop(currentTime: number) {
    if (!isRunningRef.current) return

    const deltaTime = currentTime - lastTimeRef.current
    lastTimeRef.current = currentTime

    // 1. Input + stun lock — use fresh Redux state directly
    const fi = frameInputRef.current
    const currentSubState = store.getState().game.subState
    const isStunned = currentSubState === SubState.STUNNED
    // Lock position when entering stun
    if (isStunned && !wasStunnedRef.current) {
      targetPlayerXRef.current = playerXRef.current
    }
    wasStunnedRef.current = isStunned
    if (fi.pointerActive && fi.pointerX !== null && !isStunned) {
      targetPlayerXRef.current = fi.pointerX
    }
    const dx = targetPlayerXRef.current - playerXRef.current
    playerXRef.current += dx * 0.2
    playerXRef.current = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X, playerXRef.current))

    // 2. Elapsed time
    elapsedTimeRef.current += deltaTime / 1000
    const elapsedTime = elapsedTimeRef.current

    // 3. Spawn
    const feverActive = currentSubState === SubState.FEVER
    const newEl = spawnElement(elapsedTime, feverActive)
    if (newEl) {
      elementsRef.current = [...elementsRef.current, newEl]
    }

    // 4. Move
    elementsRef.current = updateElements(elementsRef.current, deltaTime)

    // 5. Collision
    elementsRef.current = elementsRef.current.filter(el => {
      if (checkCollision(playerXRef.current, el.x, el.y)) {
        handleCollision(el)
        return false
      }
      return true
    })

    // 6. Timer updates (ms-level)
    if (currentSubState === SubState.FEVER && feverTimerRef.current === 0) {
      feverTimerRef.current = FEVER_DURATION
    }
    if (feverTimerRef.current > 0) {
      feverTimerRef.current -= deltaTime
      if (feverTimerRef.current <= 0) {
        feverTimerRef.current = 0
        dispatch(endFever())
      }
    }
    if (stunTimerRef.current > 0) {
      stunTimerRef.current -= deltaTime
      if (stunTimerRef.current <= 0) {
        stunTimerRef.current = 0
        dispatch(endStun())
      }
    }
    if (invincibleTimerRef.current > 0) {
      invincibleTimerRef.current -= deltaTime
      if (invincibleTimerRef.current <= 0) {
        invincibleTimerRef.current = 0
        dispatch(endInvincible())
      }
    }

    // 7. Second-level tick
    const currentSecond = Math.floor(elapsedTime)
    if (currentSecond !== lastSecondRef.current && currentSecond >= 0) {
      lastSecondRef.current = currentSecond
      const remaining = Math.max(0, GAME_DURATION - elapsedTime)
      dispatch(tick({ remainingTime: remaining, elapsedTime }))
      const remainingSecond = Math.ceil(remaining)
      if (remainingSecond >= 1 && remainingSecond <= 10) {
        playSFX('tick')
      }
      if (remaining <= 0) {
        dispatch(endGame())
        stopLoop()
        return
      }
    }

    // 8. Next frame
    rafIdRef.current = requestAnimationFrame(loop)
  }

  return {
    startLoop,
    stopLoop,
    resetElapsedTime,
    resetAllTimers,
    clearElements,
    isRunningRef,
    playerXRef,
    elementsRef,
    elapsedTimeRef,
    particlesRef,
    updateParticles,
  }
}
