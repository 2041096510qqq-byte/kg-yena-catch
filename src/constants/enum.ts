export enum GameState {
  IDLE = 'IDLE',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  RESULT = 'RESULT',
}

export enum SubState {
  NONE = 'NONE',
  STUNNED = 'STUNNED',
  FEVER = 'FEVER',
}

export enum ElementType {
  HEART = 'heart',
  ITEM = 'item',
  BOMB = 'bomb',
}

export interface GameElement {
  id: string
  x: number        // 归一化 0-1
  y: number        // 归一化 0-1
  speed: number    // 归一化速度（/s）
  swingPhase: number  // 爱心摇摆相位（0-2π），非爱心为0
  swingAmplitude: number // 爱心摇摆振幅，非爱心为0
  spawnTime: number   // 生成时间戳（ms）
  type: ElementType
}

export interface Particle {
  id: string
  x: number        // 归一化
  y: number
  vx: number       // 水平速度（归一化/s）
  vy: number       // 垂直速度
  life: number     // 剩余生命 ms
  maxLife: number
  color: string    // CSS 颜色
  size: number     // px
  shape: 'circle' | 'star' | 'smoke'
}

export interface PhaseConfig {
  startTime: number    // 秒
  endTime: number      // 秒
  spawnInterval: number // 生成间隔 秒
  heartProb: number    // 0-1
  itemProb: number     // 0-1
  bombProb: number     // 0-1
}

export interface FrameInput {
  pointerX: number | null  // 归一化触摸 x，null=无触摸
  pointerActive: boolean
}
