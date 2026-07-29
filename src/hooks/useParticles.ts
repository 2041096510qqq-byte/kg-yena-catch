import { useRef, useCallback } from 'react'
import { Particle } from '../constants/enum'
import { PARTICLE_SIZE_SCALE } from '../constants/game'

let particleId = 0
function genId() {
  return `p_${++particleId}_${Date.now()}`
}

type ParticleEventType = 'heart' | 'item' | 'bomb' | 'fever'

const PARTICLE_CONFIGS: Record<ParticleEventType, Omit<Particle, 'id' | 'x' | 'y' | 'life' | 'maxLife'>[]> = {
  heart: [
    { vx: -0.6, vy: -0.5, color: '#ff6b9d', size: 12, shape: 'circle' as const },
    { vx: -0.3, vy: -0.7, color: '#ffb3c6', size: 8,  shape: 'circle' as const },
    { vx: 0.3,  vy: -0.7, color: '#ff6b9d', size: 10, shape: 'circle' as const },
    { vx: 0.6,  vy: -0.5, color: '#ff8fab', size: 6,  shape: 'circle' as const },
    { vx: -0.8, vy: -0.3, color: '#ff6b9d', size: 8,  shape: 'circle' as const },
    { vx: 0.8,  vy: -0.3, color: '#ff6b9d', size: 8,  shape: 'circle' as const },
    { vx: 0,     vy: -0.8, color: '#ff8fab', size: 6,  shape: 'circle' as const },
    { vx: -0.4, vy: -0.9, color: '#ffb3c6', size: 6,  shape: 'circle' as const },
    { vx: 0.4,  vy: -0.9, color: '#ffb3c6', size: 6,  shape: 'circle' as const },
    { vx: 0,     vy: -0.4, color: '#ff6b9d', size: 10, shape: 'circle' as const },
  ],
  item: [
    { vx: -0.8, vy: -0.6, color: '#ffd700', size: 14, shape: 'star' as const },
    { vx: 0.8,  vy: -0.6, color: '#ffd700', size: 14, shape: 'star' as const },
    { vx: -0.4, vy: -0.9, color: '#fff176', size: 10, shape: 'star' as const },
    { vx: 0.4,  vy: -0.9, color: '#fff176', size: 10, shape: 'star' as const },
    { vx: 0,     vy: -1.0, color: '#ffd700', size: 12, shape: 'star' as const },
    { vx: -1.0, vy: -0.4, color: '#ffd700', size: 10, shape: 'star' as const },
    { vx: 1.0,  vy: -0.4, color: '#ffd700', size: 10, shape: 'star' as const },
    { vx: -0.6, vy: -0.3, color: '#fff176', size: 8,  shape: 'star' as const },
    { vx: 0.6,  vy: -0.3, color: '#fff176', size: 8,  shape: 'star' as const },
    { vx: 0,     vy: -0.5, color: '#ffd700', size: 12, shape: 'star' as const },
  ],
  bomb: [
    { vx: -0.6, vy: -0.4, color: '#888', size: 18, shape: 'smoke' as const },
    { vx: 0.6,  vy: -0.4, color: '#888', size: 18, shape: 'smoke' as const },
    { vx: -0.3, vy: -0.7, color: '#aaa', size: 14, shape: 'smoke' as const },
    { vx: 0.3,  vy: -0.7, color: '#aaa', size: 14, shape: 'smoke' as const },
    { vx: 0,     vy: -0.9, color: '#ccc', size: 12, shape: 'smoke' as const },
    { vx: -0.9, vy: -0.3, color: '#888', size: 12, shape: 'smoke' as const },
    { vx: 0.9,  vy: -0.3, color: '#888', size: 12, shape: 'smoke' as const },
    { vx: -0.5, vy: -0.5, color: '#bbb', size: 10, shape: 'smoke' as const },
    { vx: 0.5,  vy: -0.5, color: '#bbb', size: 10, shape: 'smoke' as const },
    { vx: 0,     vy: -0.3, color: '#999', size: 8,  shape: 'smoke' as const },
  ],
  fever: [],
}

export function useParticles() {
  const particlesRef = useRef<Particle[]>([])

  const spawnParticles = useCallback(function (
    type: ParticleEventType,
    xNorm: number,
    yNorm: number,
  ) {
    const configs = PARTICLE_CONFIGS[type]
    if (!configs) return

    const newParticles: Particle[] = configs.map(cfg => ({
      id: genId(),
      x: xNorm,
      y: yNorm,
      vx: cfg.vx,
      vy: cfg.vy,
      life: 600,
      maxLife: 600,
      color: cfg.color,
      size: cfg.size * PARTICLE_SIZE_SCALE,
      shape: cfg.shape,
    }))

    particlesRef.current = [...particlesRef.current, ...newParticles]
  }, [])

  const updateParticles = useCallback(function (deltaTime: number): Particle[] {
    const dt = deltaTime / 1000
    return particlesRef.current
      .map(p => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        life: p.life - deltaTime,
      }))
      .filter(p => p.life > 0)
  }, [])

  return { particlesRef, spawnParticles, updateParticles }
}
