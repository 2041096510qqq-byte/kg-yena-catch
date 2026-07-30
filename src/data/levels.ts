import { PhaseConfig } from '../constants/enum'

export const LEVELS: PhaseConfig[] = [
  {
    startTime: 0,
    endTime: 45,
    spawnInterval: 1.2,
    heartProb: 0.50,
    itemProb: 0.22,
    bombProb: 0.28,
  },
  {
    startTime: 45,
    endTime: 90,
    spawnInterval: 1.0,
    heartProb: 0.42,
    itemProb: 0.26,
    bombProb: 0.32,
  },
  {
    startTime: 90,
    endTime: 135,
    spawnInterval: 0.85,
    heartProb: 0.34,
    itemProb: 0.30,
    bombProb: 0.36,
  },
  {
    startTime: 135,
    endTime: 180,
    spawnInterval: 0.7,
    heartProb: 0.30,
    itemProb: 0.30,
    bombProb: 0.40,
  },
]

// 基础速度：元素从 spawn_y 到玩家区域的时间约 2.0s
export const BASE_FALL_DURATION = 2.0 // 秒
export const BASE_SPEED = 1 / BASE_FALL_DURATION // 归一化/s

// 各阶段速度倍率
export const SPEED_MULTIPLIERS = [1.0, 1.1, 1.2, 1.3]

// 加速时间段（秒）
export const SPEED_BOOST_PERIODS = [
  { start: 6, end: 20 },
  { start: 62, end: 78 },
]

// 加速倍率
export const SPEED_BOOST_MULTIPLIER = 1.5
