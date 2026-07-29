import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GameState, SubState, ElementType } from '../../constants/enum'
import {
  GAME_DURATION,
  COMBO_THRESHOLDS,
  FEVER_MAX,
  STUN_DURATION,
  INVINCIBLE_DURATION,
} from '../../constants/game'

interface GameUIState {
  gameState: GameState
  subState: SubState
  score: number
  combo: number
  maxCombo: number
  feverGauge: number
  feverCount: number
  remainingTime: number
  elapsedTime: number
  stunRemaining: number
  invincibleRemaining: number
  collectedHearts: number
  collectedItems: number
  hitBombs: number
  comboTitle: string | null
  lastScoreDelta: { value: number; x: number; y: number } | null
  totalScore: number
  bestScore: number
  unlockedSkins: string[]
  selectedSkin: string
}

function loadPersisted() {
  try {
    return {
      totalScore: Number(localStorage.getItem('totalScore') || '0'),
      bestScore: Number(localStorage.getItem('bestScore') || '0'),
      unlockedSkins: JSON.parse(localStorage.getItem('unlockedSkins') || '["default"]'),
      selectedSkin: localStorage.getItem('selectedSkin') || 'default',
    }
  } catch {
    return { totalScore: 0, bestScore: 0, unlockedSkins: ['default'], selectedSkin: 'default' }
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const persisted = loadPersisted()

const initialState: GameUIState = {
  gameState: GameState.IDLE,
  subState: SubState.NONE,
  score: 0,
  combo: 0,
  maxCombo: 0,
  feverGauge: 0,
  feverCount: 0,
  remainingTime: GAME_DURATION,
  elapsedTime: 0,
  stunRemaining: 0,
  invincibleRemaining: 0,
  collectedHearts: 0,
  collectedItems: 0,
  hitBombs: 0,
  comboTitle: null,
  lastScoreDelta: null,
  ...persisted,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame(state) {
      state.gameState = GameState.COUNTDOWN
      state.subState = SubState.NONE
      state.score = 0
      state.combo = 0
      state.maxCombo = 0
      state.feverGauge = 0
      state.feverCount = 0
      state.remainingTime = GAME_DURATION
      state.elapsedTime = 0
      state.stunRemaining = 0
      state.invincibleRemaining = 0
      state.collectedHearts = 0
      state.collectedItems = 0
      state.hitBombs = 0
      state.comboTitle = null
      state.lastScoreDelta = null
    },
    countdownEnd(state) {
      state.gameState = GameState.PLAYING
    },
    pauseGame(state) {
      if (state.gameState === GameState.PLAYING) {
        state.gameState = GameState.PAUSED
      }
    },
    resumeGame(state) {
      if (state.gameState === GameState.PAUSED) {
        state.gameState = GameState.PLAYING
      }
    },
    endGame(state) {
      state.gameState = GameState.RESULT
      state.totalScore += state.score
      persist('totalScore', state.totalScore)
      if (state.score > state.bestScore) {
        state.bestScore = state.score
        persist('bestScore', state.bestScore)
      }
    },
    resetToIdle(state) {
      state.gameState = GameState.IDLE
      state.subState = SubState.NONE
    },
    tick(state, action: PayloadAction<{ remainingTime: number; elapsedTime: number }>) {
      state.remainingTime = action.payload.remainingTime
      state.elapsedTime = action.payload.elapsedTime
    },
    addScore(state, action: PayloadAction<{ delta: number; x: number; y: number }>) {
      const { delta, x, y } = action.payload
      const actualDelta = state.subState === SubState.FEVER ? delta * 2 : delta
      state.score += actualDelta
      state.lastScoreDelta = { value: actualDelta, x, y }
    },
    setCombo(state, action: PayloadAction<number>) {
      state.combo = action.payload
      if (state.combo > state.maxCombo) state.maxCombo = state.combo
      for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
        const t = COMBO_THRESHOLDS[i]
        if (state.combo >= t.minCombo) {
          if (state.comboTitle !== t.title) {
            state.comboTitle = t.title
          }
          break
        }
      }
    },
    incrementFeverGauge(state) {
      if (state.subState !== SubState.FEVER) {
        state.feverGauge += 1
        if (state.feverGauge >= FEVER_MAX) {
          state.subState = SubState.FEVER
          state.feverGauge = 0
          state.feverCount += 1
        }
      }
    },
    resetFeverGauge(state) {
      state.feverGauge = 0
    },
    triggerFever(state) {
      state.subState = SubState.FEVER
    },
    endFever(state) {
      state.subState = SubState.NONE
      state.feverGauge = 0
    },
    triggerStun(state) {
      state.subState = SubState.STUNNED
      state.stunRemaining = STUN_DURATION
      state.combo = 0
    },
    endStun(state) {
      state.subState = SubState.NONE
      state.stunRemaining = 0
      state.invincibleRemaining = INVINCIBLE_DURATION
    },
    endInvincible(state) {
      state.invincibleRemaining = 0
    },
    recordCollect(state, action: PayloadAction<ElementType>) {
      if (action.payload === ElementType.HEART) state.collectedHearts += 1
      else if (action.payload === ElementType.ITEM) state.collectedItems += 1
      else if (action.payload === ElementType.BOMB) state.hitBombs += 1
    },
    showFloatScore(state, action: PayloadAction<{ value: number; x: number; y: number }>) {
      state.lastScoreDelta = action.payload
    },
    showComboTitle(state, action: PayloadAction<string>) {
      state.comboTitle = action.payload
    },
    clearComboTitle(state) {
      state.comboTitle = null
    },
    clearLastScoreDelta(state) {
      state.lastScoreDelta = null
    },
    selectSkin(state, action: PayloadAction<string>) {
      state.selectedSkin = action.payload
      persist('selectedSkin', action.payload)
    },
    unlockSkin(state, action: PayloadAction<string>) {
      if (!state.unlockedSkins.includes(action.payload)) {
        state.unlockedSkins.push(action.payload)
        persist('unlockedSkins', state.unlockedSkins)
      }
    },
  },
})

export const {
  startGame,
  countdownEnd,
  pauseGame,
  resumeGame,
  endGame,
  resetToIdle,
  tick,
  addScore,
  setCombo,
  incrementFeverGauge,
  resetFeverGauge,
  triggerFever,
  endFever,
  triggerStun,
  endStun,
  endInvincible,
  recordCollect,
  showFloatScore,
  showComboTitle,
  clearComboTitle,
  clearLastScoreDelta,
  selectSkin,
  unlockSkin,
} = gameSlice.actions

export default gameSlice.reducer