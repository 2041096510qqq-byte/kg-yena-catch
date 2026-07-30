// 游戏总时长（秒）
export const GAME_DURATION = 78

// 游戏设计尺寸（px）
export const GAME_WIDTH = 750
export const GAME_HEIGHT = 1334

// Combo 阈值配置（5级）
export const COMBO_THRESHOLDS = [
  { level: 1, minCombo: 3,  title: 'Nice!',        extraScore: 2 },
  { level: 2, minCombo: 7,  title: 'Great!',       extraScore: 5 },
  { level: 3, minCombo: 15, title: 'Amazing!',     extraScore: 10 },
  { level: 4, minCombo: 25, title: 'Catch Catch!', extraScore: 20 },
  { level: 5, minCombo: 40, title: 'Unreal!',      extraScore: 30 },
] as const

// 结算星级阈值（目标分100）
export const STAR_THRESHOLDS = [
  { stars: 1, minScore: 30  },
  { stars: 2, minScore: 60  },
  { stars: 3, minScore: 100 },
  { stars: 4, minScore: 130 },
  { stars: 5, minScore: 160 },
] as const

// Fever 配置
export const FEVER_MAX = 8         // 槽位数
export const FEVER_DURATION = 10000 // ms

// 眩晕配置
export const STUN_DURATION = 2000      // ms
export const INVINCIBLE_DURATION = 1500 // ms

// 碰撞判定：重叠面积 >= 50%
export const COLLISION_OVERLAP_THRESHOLD = 0.5

// 玩家区域
export const PLAYER_WIDTH = 80    // px
export const PLAYER_HEIGHT = 80    // px
export const PLAYER_VISUAL_SIZE = 150 // px
export const PLAYER_MIN_X = 0.10  // 归一化
export const PLAYER_MAX_X = 0.90  // 归一化

// 元素尺寸
export const ELEMENT_SIZE = 64     // px

// 元素横向生成范围（归一化）
export const ELEMENT_SPAWN_MIN_X = 0.08
export const ELEMENT_SPAWN_MAX_X = 0.92

// 元素生成起点 Y（归一化）
export const ELEMENT_SPAWN_Y = 0.25

// 元素销毁 Y（超出此值则销毁）
export const ELEMENT_DESPAWN_Y = 1.1

// 粒子视觉尺寸倍率
export const PARTICLE_SIZE_SCALE = 2.2
