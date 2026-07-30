import { useCallback } from 'react'
import { ASSETS } from '../constants/assets'

export type SfxType = 'heart' | 'item' | 'bomb' | 'fever' | 'combo' | 'stun' | 'tick'

const SFX_CONFIG: Record<SfxType, { freq: number; duration: number; type: OscillatorType; gain: number }> = {
  heart:  { freq: 880, duration: 0.1, type: 'sine', gain: 0.3 },
  item:   { freq: 1320, duration: 0.15, type: 'triangle', gain: 0.4 },
  bomb:   { freq: 120, duration: 0.3, type: 'sawtooth', gain: 0.5 },
  fever:  { freq: 1760, duration: 0.5, type: 'sine', gain: 0.4 },
  combo:  { freq: 660, duration: 0.1, type: 'triangle', gain: 0.3 },
  stun:   { freq: 200, duration: 0.4, type: 'square', gain: 0.3 },
  tick:   { freq: 440, duration: 0.05, type: 'square', gain: 0.2 },
}

const FILE_SFX: Partial<Record<SfxType, string>> = {
  heart: ASSETS.audio.scoreBonus,
  item: ASSETS.audio.scoreBonus,
  bomb: ASSETS.audio.explosion,
  fever: ASSETS.audio.feverBoost,
}

let bgmAudio: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null
let activeGameAudioOwners = 0
let gameAudioOwnerToken = 0

const activeSfx = new Set<HTMLAudioElement>()
const sfxTemplates: Partial<Record<SfxType, HTMLAudioElement>> = {}

function stopAudioElement(audio: HTMLAudioElement | null | undefined) {
  if (!audio) return
  try {
    audio.pause()
    if (audio.currentTime) audio.currentTime = 0
  } catch {
    // Best-effort stop; avoid src/load teardown which can hang on some mobile browsers.
  }
}

function getBGM(): HTMLAudioElement {
  if (!bgmAudio) {
    bgmAudio = new Audio(ASSETS.audio.bgmGame)
    bgmAudio.loop = true
    bgmAudio.volume = 0.35
  }
  return bgmAudio
}

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext()
  }
  return audioContext
}

function playSyntheticSFX(type: SfxType) {
  try {
    const ctx = getAudioContext()
    const cfg = SFX_CONFIG[type]
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = cfg.type
    osc.frequency.value = cfg.freq
    gain.gain.setValueAtTime(cfg.gain, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + cfg.duration)
  } catch {
    // Audio is optional; gameplay must continue if the browser blocks it.
  }
}

function stopSharedBGM() {
  bgmAudio?.pause()
  if (bgmAudio) {
    bgmAudio.currentTime = 0
  }
}

/**
 * Hard-reset audio for a new round. Must run inside a user gesture on mobile
 * so BGM/SFX templates are unlocked for the rest of the session.
 * Must never throw — callers rely on continuing into startGame().
 */
export function resetAudioSession() {
  try {
    activeSfx.forEach(stopAudioElement)
    activeSfx.clear()

    stopAudioElement(bgmAudio)
    bgmAudio = null

    ;(Object.keys(sfxTemplates) as SfxType[]).forEach(key => {
      stopAudioElement(sfxTemplates[key])
      delete sfxTemplates[key]
    })

    try {
      const ctx = getAudioContext()
      if (ctx.state !== 'running') {
        void ctx.resume().catch(() => undefined)
      }
    } catch {
      // AudioContext construction/resume is optional.
    }

    // Prime file SFX during the gesture so later cloneNode()/play() works on iOS.
    ;(Object.entries(FILE_SFX) as [SfxType, string][]).forEach(([type, file]) => {
      try {
        const audio = new Audio(file)
        audio.muted = true
        sfxTemplates[type] = audio
        void audio.play().then(() => {
          audio.pause()
          audio.currentTime = 0
          audio.muted = false
          audio.volume = 0.65
        }).catch(() => {
          audio.muted = false
          audio.volume = 0.65
        })
      } catch {
        // Keep going; playSFX can still fall back per event.
      }
    })
  } catch {
    // Never block starting a new round because audio reset failed.
  }
}

export function retainGameAudioOwner() {
  activeGameAudioOwners += 1
  gameAudioOwnerToken += 1
}

export function releaseGameAudioOwner() {
  activeGameAudioOwners = Math.max(0, activeGameAudioOwners - 1)
  const releaseToken = ++gameAudioOwnerToken

  queueMicrotask(() => {
    if (activeGameAudioOwners === 0 && releaseToken === gameAudioOwnerToken) {
      stopSharedBGM()
    }
  })
}

export function useGameAudio() {
  const playBGM = useCallback(async () => {
    try {
      const ctx = getAudioContext()
      if (ctx.state !== 'running') {
        // Resume without awaiting so the call stays inside the user-gesture window on mobile.
        void ctx.resume().catch(() => undefined)
      }
    } catch {
      // AudioContext construction/resume is optional and must not block BGM.
    }

    try {
      await getBGM().play().catch(() => undefined)
    } catch {
      // Audio element construction can fail in non-browser environments.
    }
  }, [])

  const pauseBGM = useCallback(() => {
    bgmAudio?.pause()
  }, [])

  const stopBGM = useCallback(() => {
    stopSharedBGM()
  }, [])

  const playSFX = useCallback((type: SfxType) => {
    const file = FILE_SFX[type]
    if (!file) {
      playSyntheticSFX(type)
      return
    }

    let didFallback = false
    const fallback = (reason?: unknown) => {
      if (didFallback) return
      // Interrupted playback should stay silent — synthetic beeps here cause mobile "chaos".
      if (
        reason
        && typeof reason === 'object'
        && 'name' in reason
        && (reason as { name?: string }).name === 'AbortError'
      ) {
        return
      }
      didFallback = true
      playSyntheticSFX(type)
    }

    try {
      const template = sfxTemplates[type]
      // Prefer clone of gesture-unlocked template on mobile; otherwise a fresh instance.
      const audio = template
        ? (template.cloneNode(true) as HTMLAudioElement)
        : new Audio(file)
      audio.muted = false
      audio.volume = 0.65
      activeSfx.add(audio)
      const release = () => activeSfx.delete(audio)
      audio.addEventListener('ended', release, { once: true })
      audio.addEventListener('error', () => {
        release()
        fallback()
      }, { once: true })
      void audio.play().catch(err => {
        release()
        fallback(err)
      })
    } catch {
      fallback()
    }
  }, [])

  return { playBGM, pauseBGM, stopBGM, playSFX }
}
