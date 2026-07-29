import { PhaseConfig } from '../constants/enum'

export const LEVELS: PhaseConfig[] = [
  {
    startTime: 0,
    endTime: 45,
    spawnInterval: 1.2,
    heartProb: 0.57,
    itemProb: 0.25,
    bombProb: 0.18,
  },
  {
    startTime: 45,
    endTime: 90,
    spawnInterval: 1.0,
    heartProb: 0.48,
    itemProb: 0.30,
    bombProb: 0.22,
  },
  {
    startTime: 90,
    endTime: 135,
    spawnInterval: 0.85,
    heartProb: 0.39,
    itemProb: 0.35,
    bombProb: 0.26,
  },
  {
    startTime: 135,
    endTime: 180,
    spawnInterval: 0.7,
    heartProb: 0.35,
    itemProb: 0.35,
    bombProb: 0.30,
  },
]

// 基础速度：元素从 spawn_y 到玩家区域的时间约 2.5s
export const BASE_FALL_DURATION = 2.5 // 秒
export const BASE_SPEED = 1 / BASE_FALL_DURATION // 归一化/s

// 各阶段速度倍率
export const SPEED_MULTIPLIERS = [1.0, 1.1, 1.2, 1.3]
