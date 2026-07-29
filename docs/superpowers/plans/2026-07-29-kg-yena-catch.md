# kg_yena_catch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的 Yena 粉丝接礼物游戏（180秒/3分钟），支持移动端触摸和桌面鼠标操作，DOM+CSS渲染，Redux状态管理，等比缩放适配不同屏幕。

**Architecture:** 项目分为主线A（骨架）、主线B（核心逻辑）、主线C（UI组件）、主线D（音效）。主线A完成后，主线B和C可并行开发。B中的useGameLoop是核心，其他Hooks围绕它运作。

**Tech Stack:** React 18.x / TypeScript 5.x / Redux @reduxjs/toolkit / Vite 5.x / Less + postcss-pxtorem / Web Audio API

---

## Global Constraints

- 游戏时长: 180秒（3分钟）
- 设计稿基准: 750×1334px
- 目标分辨率缩放适配: `min(screenWidth/750, screenHeight/1334)` scale to fit
- 触摸坐标映射: 需反向映射到750坐标系
- maxConcurrentEntities: ~39（8元素+1小人+~30粒子）
- 帧级实体: useRef，不走Redux渲染管线
- Redux: 仅在碰撞事件/每秒计时/状态变化时dispatch
- Combo阈值: 3/7/15/25/40（五级 Nice!/Great!/Amazing!/Catch Catch!/Unreal!）
- Fever: 8格槽，满后持续10秒，双倍得分+无炸弹
- 眩晕: 接到炸弹后5秒操作失效 + 1.5秒无敌窗口
- 结算星级（目标100分）: 30/60/100/130/160（五档）
- 四阶段掉落参数: Q1(0-45s)/Q2(45-90s)/Q3(90-135s)/Q4(135-180s)

---

## File Structure (Final)

```
kg_yena_catch/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── assets/
│       ├── imgs/
│       └── audio/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── apis/
│   │   ├── index.ts
│   │   └── mocks/
│   │       └── index.ts
│   ├── components/
│   │   ├── ModalLayer/
│   │   │   ├── index.tsx
│   │   │   └── index.less
│   │   └── FxLayer/
│   │       ├── index.tsx
│   │       └── index.less
│   ├── constants/
│   │   ├── index.ts
│   │   ├── enum.ts
│   │   └── game.ts
│   ├── data/
│   │   └── levels.ts
│   ├── hooks/
│   │   ├── useGameLoop.ts
│   │   ├── useGameElements.ts
│   │   ├── useCollision.ts
│   │   ├── useGameInput.ts
│   │   ├── useGameAudio.ts
│   │   ├── useCountdown.ts
│   │   └── useParticles.ts
│   ├── pages/
│   │   ├── HomePage/
│   │   │   ├── index.tsx
│   │   │   └── index.less
│   │   └── GamePage/
│   │       ├── index.tsx
│   │       └── index.less
│   ├── store/
│   │   ├── index.ts
│   │   └── slices/
│   │       └── gameSlice.ts
│   ├── styles/
│   │   ├── variables.less
│   │   └── global.less
│   ├── types/
│   │   └── global.d.ts
│   └── utils/
│       ├── index.ts
│       ├── math.ts
│       └── random.ts
```

---

## Task Map

| # | 任务 | 文件 | 依赖 |
|---|------|------|------|
| 1 | 初始化项目骨架 | package.json, vite.config.ts, tsconfig.json, index.html | 无 |
| 2 | 配置Less + Redux + 目录结构 | styles/, store/, constants/, types/, utils/ | 1 |
| 3 | 定义类型和枚举 | enum.ts, types/global.d.ts | 1 |
| 4 | 屏幕适配容器 | GameViewport.tsx | 1 |
| 5 | 游戏数值常量 | constants/game.ts, data/levels.ts | 3 |
| 6 | Redux store + gameSlice | store/index.ts, store/slices/gameSlice.ts | 3 |
| 7 | HomePage（主界面） | pages/HomePage/ | 2, 6 |
| 8 | useGameInput | hooks/useGameInput.ts | 4 |
| 9 | useGameLoop + useGameElements | hooks/useGameLoop.ts, useGameElements.ts | 5, 6, 8 |
| 10 | useCollision | hooks/useCollision.ts | 9 |
| 11 | useParticles | hooks/useParticles.ts | 9 |
| 12 | GamePage骨架 + HUD | pages/GamePage/, components/HUD/ | 6, 9, 10, 11 |
| 13 | PlayerArea + PlayerSprite | pages/GamePage/PlayerArea.tsx | 8, 9 |
| 14 | YenaStage | pages/GamePage/YenaStage.tsx | 12 |
| 15 | CoreStage（元素舞台） | pages/GamePage/CoreStage.tsx | 9, 10, 11 |
| 16 | Fever/眩晕/无敌逻辑 | useGameLoop.ts（集成） | 6, 9, 10 |
| 17 | FxLayer（浮动分数/Combo称号） | components/FxLayer/ | 6, 11 |
| 18 | ModalLayer + PauseModal | components/ModalLayer/, PauseModal | 6 |
| 19 | ResultModal（结算） | components/ModalLayer/ResultModal | 6, 17 |
| 20 | useGameAudio | hooks/useGameAudio.ts | 2 |
| 21 | 素材占位符替换 | public/assets/ | 1 |
| 22 | 集成测试 + 收尾 | — | 全部 |

---

## Task 1: 初始化项目骨架

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`

**Interfaces:**
- Produces: 可运行的 `npm run dev` 开发服务器

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "kg-yena-catch",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@reduxjs/toolkit": "^2.3.0",
    "redux": "^5.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "less": "^4.2.1",
    "postcss": "^8.4.49",
    "postcss-pxtorem": "^6.1.0",
    "typescript": "^5.6.3",
    "vite": "^5.4.11"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>kg_yena_catch</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #root { width: 100%; height: 100%; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 运行 npm install 验证**

```bash
npm install
```
Expected: 依赖安装成功，无报错

- [ ] **Step 6: 提交**

```bash
git add package.json vite.config.ts tsconfig.json index.html
git commit -m "feat: initialize Vite + React + TypeScript project
```

---

## Task 2: 配置Less + Redux + 目录结构

**Files:**
- Create: `src/styles/variables.less`
- Create: `src/styles/global.less`
- Create: `src/store/index.ts`
- Create: `src/store/slices/.gitkeep`
- Create: `src/utils/index.ts`, `src/utils/math.ts`, `src/utils/random.ts`
- Create: `src/constants/.gitkeep`
- Create: `src/types/global.d.ts`
- Create: `public/assets/imgs/.gitkeep`
- Create: `public/assets/audio/.gitkeep`
- Create: `src/main.tsx` (minimal)

**Interfaces:**
- Consumes: Task 1
- Produces: 项目目录结构完整，Less变量/全局样式/Redux store占位符

- [ ] **Step 1: 创建 src/styles/variables.less**

```less
// 设计稿基准 750px
@design-width: 750px;
@design-height: 1334px;

// 颜色（占位符，后续按素材调整）
@color-bg: #1a1a2e;
@color-primary: #ff6b9d;
@color-secondary: #ffd700;
@color-danger: #ff4444;
@color-text: #ffffff;

// 字号
@font-size-base: 24px;

// 间距
@gap-xs: 8px;
@gap-sm: 16px;
@gap-md: 24px;
@gap-lg: 32px;

// 圆角
@radius-sm: 8px;
@radius-md: 16px;
@radius-lg: 24px;

// Z-index
@z-hud: 20;
@z-player: 10;
@z-modal: 200;
@z-fx: 100;
```

- [ ] **Step 2: 创建 src/styles/global.less**

```less
@import './variables.less';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  overflow: hidden;
  background: @color-bg;
  color: @color-text;
}
```

- [ ] **Step 3: 创建 src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import './styles/global.less'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
)
```

- [ ] **Step 4: 创建 src/App.tsx 占位符**

```tsx
import React from 'react'

export default function App() {
  return <div id="app-root">Hello kg_yena_catch</div>
}
```

- [ ] **Step 5: 创建 src/store/index.ts**

```typescript
import { configureStore } from '@reduxjs/toolkit'

export const store = configureStore({
  reducer: {},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

- [ ] **Step 6: 创建 src/types/global.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.mp3' {
  const content: string
  export default content
}
```

- [ ] **Step 7: 创建 src/utils/index.ts 等工具文件（空实现占位）**

```typescript
// utils/index.ts
export * from './math'
export * from './random'
```

- [ ] **Step 8: 运行 npm run dev 验证项目启动**

```bash
npm run dev
```
Expected: Vite dev server 启动，无报错

- [ ] **Step 9: 提交**

```bash
git add src/
git commit -m "feat: add Less, Redux, project structure and global styles
```

---

## Task 3: 定义类型和枚举

**Files:**
- Create: `src/constants/enum.ts`
- Modify: `src/types/global.d.ts`

**Interfaces:**
- Consumes: 无
- Produces: 所有游戏类型定义，供后续所有模块使用

- [ ] **Step 1: 创建 src/constants/enum.ts**

```typescript
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
  type: ElementType
  x: number        // 归一化 0-1
  y: number        // 归一化 0-1
  speed: number    // 归一化速度（/s）
  swingPhase: number  // 爱心摇摆相位（0-2π），非爱心为0
  swingAmplitude: number // 爱心摇摆振幅，非爱心为0
  spawnTime: number   // 生成时间戳（ms）
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
```

- [ ] **Step 2: 更新 src/types/global.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.mp3' {
  const content: string
  export default content
}

export {}
```

- [ ] **Step 3: 提交**

```bash
git add src/constants/enum.ts
git commit -m "feat: add game types and enums (GameState, SubState, ElementType, etc.)
```

---

## Task 4: 屏幕适配容器

**Files:**
- Create: `src/components/GameViewport.tsx`
- Create: `src/components/GameViewport.less`

**Interfaces:**
- Consumes: 无
- Produces: `GameViewport` 组件，包裹游戏内容，等比缩放适配

- [ ] **Step 1: 创建 GameViewport.tsx**

```tsx
import React, { useEffect, useRef, useState } from 'react'
import './GameViewport.less'

const DESIGN_WIDTH = 750
const DESIGN_HEIGHT = 1334

interface GameViewportProps {
  children: React.ReactNode
}

export default function GameViewport({ children }: GameViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    function resize() {
      const screenW = window.innerWidth
      const screenH = window.innerHeight
      const scaleX = screenW / DESIGN_WIDTH
      const scaleY = screenH / DESIGN_HEIGHT
      const currentScale = Math.min(scaleX, scaleY)
      setScale(currentScale)
      // 垂直居中
      const scaledHeight = DESIGN_HEIGHT * currentScale
      setOffsetY((screenH - scaledHeight) / 2)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <div
      ref={containerRef}
      className="game-viewport"
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
    >
      <div
        className="game-stage"
        style={{
          position: 'absolute',
          top: offsetY,
          left: 0,
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 GameViewport.less**

```less
.game-viewport {
  background: #1a1a2e;
}

.game-stage {
  overflow: hidden;
}
```

- [ ] **Step 3: 更新 App.tsx 使用 GameViewport**

```tsx
import React from 'react'
import GameViewport from './components/GameViewport'

export default function App() {
  return (
    <GameViewport>
      <div style={{ width: 750, height: 1334, background: '#1a1a2e' }}>
        Hello kg_yena_catch
      </div>
    </GameViewport>
  )
}
```

- [ ] **Step 4: 验证适配效果**

浏览器缩放窗口大小，检查游戏舞台是否等比缩放且垂直居中

- [ ] **Step 5: 提交**

```bash
git add src/components/GameViewport.tsx src/components/GameViewport.less src/App.tsx
git commit -m "feat: add GameViewport with responsive scaling
```

---

## Task 5: 游戏数值常量

**Files:**
- Create: `src/constants/game.ts`
- Create: `src/data/levels.ts`

**Interfaces:**
- Consumes: Task 3 的类型定义
- Produces: `GAME_CONFIG`, `LEVELS`, `COMBO_THRESHOLDS`, `STAR_THRESHOLDS` 等常量

- [ ] **Step 1: 创建 src/constants/game.ts**

```typescript
// 游戏总时长（秒）
export const GAME_DURATION = 180

// Combo 阈值配置
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
export const STUN_DURATION = 5000  // ms
export const INVINCIBLE_DURATION = 1500 // ms

// 碰撞判定：重叠面积 >= 50%
export const COLLISION_OVERLAP_THRESHOLD = 0.5

// 玩家区域
export const PLAYER_WIDTH = 60    // px
export const PLAYER_HEIGHT = 60    // px
export const PLAYER_MIN_X = 0.10  // 归一化
export const PLAYER_MAX_X = 0.90  // 归一化

// 元素尺寸
export const ELEMENT_SIZE = 50     // px

// Yena 手部位置（归一化）
export const YENA_HAND_X = 0.5    // 居中
export const YENA_HAND_X_VARIANCE = 0.15 // ±15% 随机偏移

// 元素生成起点 Y（归一化）
export const ELEMENT_SPAWN_Y = 0.25 // Yena 手部附近

// 元素销毁 Y（超出此值则销毁）
export const ELEMENT_DESPAWN_Y = 1.1
```

- [ ] **Step 2: 创建 src/data/levels.ts**

```typescript
import { PhaseConfig } from '../constants/enum'

export const LEVELS: PhaseConfig[] = [
  {
    startTime: 0,
    endTime: 45,
    spawnInterval: 1.2,
    heartProb: 0.65,
    itemProb: 0.25,
    bombProb: 0.10,
  },
  {
    startTime: 45,
    endTime: 90,
    spawnInterval: 1.0,
    heartProb: 0.55,
    itemProb: 0.30,
    bombProb: 0.15,
  },
  {
    startTime: 90,
    endTime: 135,
    spawnInterval: 0.85,
    heartProb: 0.45,
    itemProb: 0.35,
    bombProb: 0.20,
  },
  {
    startTime: 135,
    endTime: 180,
    spawnInterval: 0.7,
    heartProb: 0.40,
    itemProb: 0.35,
    bombProb: 0.25,
  },
]

// 基础速度：元素从 spawn_y 到玩家区域的时间约 2.5s
export const BASE_FALL_DURATION = 2.5 // 秒
export const BASE_SPEED = 1 / BASE_FALL_DURATION // 归一化/s

// 各阶段速度倍率
export const SPEED_MULTIPLIERS = [1.0, 1.1, 1.2, 1.3]
```

- [ ] **Step 3: 提交**

```bash
git add src/constants/game.ts src/data/levels.ts
git commit -m "feat: add game constants (GAME_DURATION, COMBO_THRESHOLDS, STAR_THRESHOLDS, FEVER, STUN) and level spawn parameters
```

---

## Task 6: Redux store + gameSlice

**Files:**
- Modify: `src/store/index.ts`
- Create: `src/store/slices/gameSlice.ts`

**Interfaces:**
- Consumes: Task 3 类型定义, Task 5 常量
- Produces: Redux store with `gameSlice` — 全游戏 UI 状态

**gameSlice State:**
```typescript
{
  gameState: GameState      // IDLE | COUNTDOWN | PLAYING | PAUSED | RESULT
  subState: SubState        // NONE | STUNNED | FEVER
  score: number
  combo: number
  maxCombo: number
  feverGauge: number        // 0-8
  feverCount: number
  remainingTime: number     // 秒
  elapsedTime: number       // 秒
  stunRemaining: number     // ms
  invincibleRemaining: number // ms
  collectedHearts: number
  collectedItems: number
  hitBombs: number
  comboTitle: string | null
  lastScoreDelta: { value: number, x: number, y: number } | null
  totalScore: number         // localStorage 持久化
  bestScore: number          // localStorage 持久化
  unlockedSkins: string[]    // localStorage 持久化
  selectedSkin: string       // localStorage 持久化
}
```

**Actions:**
- `startGame()` — 初始化，进入 COUNTDOWN
- `countdownEnd()` — 倒计时结束，进入 PLAYING
- `pauseGame()` — 进入 PAUSED
- `resumeGame()` — 恢复 PLAYING
- `endGame()` — 进入 RESULT
- `resetToIdle()` — 回到 IDLE
- `tick(remainingTime, elapsedTime)` — 每秒更新计时
- `addScore(delta, x, y)` — 加分并触发浮动分数
- `setCombo(combo)` — 更新 Combo（含称号检测）
- `incrementFeverGauge()` — Fever 槽 +1
- `resetFeverGauge()` — Fever 槽归零
- `triggerFever()` — 进入 FEVER 子状态
- `endFever()` — 退出 FEVER
- `triggerStun()` — 进入 STUNNED
- `endStun()` — 退出 STUNNED，开始无敌
- `endInvincible()` — 无敌结束
- `recordCollect(type)` — 统计记录
- `showFloatScore(value, x, y)` — 触发浮动分数
- `showComboTitle(title)` — 触发 Combo 称号
- `selectSkin(id)` — 切换皮肤
- `unlockSkin(id)` — 解锁皮肤

- [ ] **Step 1: 创建 src/store/slices/gameSlice.ts**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GameState, SubState, ElementType } from '../../constants/enum'
import {
  GAME_DURATION,
  COMBO_THRESHOLDS,
  STAR_THRESHOLDS,
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
      // 更新持久化
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
      // 检测称号
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
```

- [ ] **Step 2: 更新 src/store/index.ts**

```typescript
import { configureStore } from '@reduxjs/toolkit'
import gameReducer from './slices/gameSlice'

export const store = configureStore({
  reducer: {
    game: gameReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

- [ ] **Step 3: 提交**

```bash
git add src/store/
git commit -m "feat: add gameSlice with full game state, actions and localStorage persistence
```

---

## Task 7: HomePage（主界面）

**Files:**
- Create: `src/pages/HomePage/index.tsx`
- Create: `src/pages/HomePage/index.less`

**Interfaces:**
- Consumes: Task 6 (Redux store), Task 2 (styles)
- Produces: `HomePage` — 展示皮肤入口 + 开始按钮

- [ ] **Step 1: 创建 HomePage/index.tsx**

```tsx
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { startGame } from '../../store/slices/gameSlice'
import { RootState } from '../../store'
import './index.less'

export default function HomePage() {
  const dispatch = useDispatch()
  const { totalScore, bestScore, selectedSkin } = useSelector((s: RootState) => s.game)

  function handleStart() {
    dispatch(startGame())
  }

  return (
    <div className="home-page">
      <div className="home-title">Catch Catch!</div>
      <div className="home-subtitle">YENA</div>

      <div className="home-stats">
        <div className="stat-item">
          <span className="stat-label">历史总分</span>
          <span className="stat-value">{totalScore}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">最高分</span>
          <span className="stat-value">{bestScore}</span>
        </div>
      </div>

      <div className="home-actions">
        <button className="btn-skin" onClick={() => {}}>
          皮肤 {selectedSkin}
        </button>
        <button className="btn-start" onClick={handleStart}>
          开始游戏
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 HomePage/index.less**

```less
.home-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120px 40px 60px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.home-title {
  font-size: 72px;
  font-weight: 700;
  color: #ff6b9d;
  text-shadow: 0 4px 20px rgba(255, 107, 157, 0.5);
  margin-bottom: 8px;
}

.home-subtitle {
  font-size: 36px;
  color: #ffd700;
  letter-spacing: 8px;
  margin-bottom: 60px;
}

.home-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 60px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

.home-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 400px;
}

.btn-skin {
  width: 120px;
  height: 60px;
  border-radius: 30px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.btn-start {
  width: 100%;
  height: 88px;
  border-radius: 44px;
  border: none;
  background: linear-gradient(135deg, #ff6b9d, #ff8a80);
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(255, 107, 157, 0.4);
}
```

- [ ] **Step 3: 更新 App.tsx 根据 gameState 切换页面**

```tsx
import React from 'react'
import { useSelector } from 'react-redux'
import GameViewport from './components/GameViewport'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import { RootState } from './store'
import { GameState } from './constants/enum'

export default function App() {
  const gameState = useSelector((s: RootState) => s.game.gameState)

  return (
    <GameViewport>
      {gameState === GameState.IDLE && <HomePage />}
      {gameState !== GameState.IDLE && <GamePage />}
    </GameViewport>
  )
}
```

- [ ] **Step 4: 提交**

```bash
git add src/pages/HomePage/ src/App.tsx
git commit -m "feat: add HomePage with title, stats and start button
```

---

## Task 8: useGameInput（触摸/鼠标输入）

**Files:**
- Create: `src/hooks/useGameInput.ts`

**Interfaces:**
- Consumes: Task 4 (GameViewport scale 逻辑间接依赖)
- Produces: `frameInputRef` — { pointerX: number|null, pointerActive: boolean }，归一化到 0-1
- Used by: useGameLoop (Task 9)

- [ ] **Step 1: 创建 useGameInput.ts**

```typescript
import { useEffect, useRef } from 'react'
import { FrameInput } from '../constants/enum'

const DESIGN_WIDTH = 750

export function useGameInput() {
  const frameInputRef = useRef<FrameInput>({
    pointerX: null,
    pointerActive: false,
  })

  useEffect(() => {
    function getNormalizedX(clientX: number): number {
      const stage = document.querySelector('.game-stage') as HTMLElement
      if (!stage) return 0.5
      const rect = stage.getBoundingClientRect()
      const relativeX = clientX - rect.left
      const scale = rect.width / DESIGN_WIDTH
      return Math.max(0, Math.min(1, relativeX / rect.width))
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      const t = e.touches[0]
      frameInputRef.current = { pointerX: getNormalizedX(t.clientX), pointerActive: true }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (!frameInputRef.current.pointerActive) return
      const t = e.touches[0]
      frameInputRef.current.pointerX = getNormalizedX(t.clientX)
    }

    function onTouchEnd(e: TouchEvent) {
      e.preventDefault()
      frameInputRef.current = { pointerX: null, pointerActive: false }
    }

    function onMouseDown(e: MouseEvent) {
      frameInputRef.current = { pointerX: getNormalizedX(e.clientX), pointerActive: true }
    }

    function onMouseMove(e: MouseEvent) {
      if (!frameInputRef.current.pointerActive) return
      frameInputRef.current.pointerX = getNormalizedX(e.clientX)
    }

    function onMouseUp() {
      frameInputRef.current = { pointerX: null, pointerActive: false }
    }

    const opts = { passive: false }
    document.addEventListener('touchstart', onTouchStart, opts)
    document.addEventListener('touchmove', onTouchMove, opts)
    document.addEventListener('touchend', onTouchEnd, opts)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return { frameInputRef }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/hooks/useGameInput.ts
git commit -m "feat: add useGameInput for touch and mouse handling
```

---

## Task 9: useGameLoop + useGameElements

**Files:**
- Create: `src/hooks/useGameLoop.ts`
- Create: `src/hooks/useGameElements.ts`
- Modify: `src/utils/math.ts`

**Interfaces:**
- Consumes: Task 6 (Redux actions), Task 5 (LEVELS, SPEED_MULTIPLIERS, GAME_CONFIG), Task 8 (frameInputRef), Task 3 (类型)
- Produces: `useGameLoop` — 核心 rAF 循环，驱动所有游戏逻辑
- Produces: `useGameElements` — 元素生成/移动/销毁管理

**useGameLoop 每帧阶段序：**
1. 计算 Δt
2. 读取 frameInputRef → 更新 targetPlayerXRef
3. 生成判断（查当前阶段掉落参数）
4. 移动更新（y += speed×Δt，爱心附加 sin 摇摆）
5. 碰撞检测（调用 useCollision）
6. 结算处理（dispatch Redux）
7. 计时更新（每帧更新 fever/stun/invincible 计时，每秒更新倒计时）
8. DOM 渲染（直接操作 ref 更新 transform）
9. rAF 下一帧

- [ ] **Step 1: 创建 src/utils/math.ts**

```typescript
// 矩形重叠面积比例
export function overlapRatio(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): number {
  const x = Math.max(ax, bx)
  const y = Math.max(ay, by)
  const w = Math.max(0, Math.min(ax + aw, bx + bw) - x)
  const h = Math.max(0, Math.min(ay + ah, by + bh) - y)
  const overlapArea = w * h
  const minArea = Math.min(aw * ah, bw * bh)
  return minArea > 0 ? overlapArea / minArea : 0
}
```

- [ ] **Step 2: 创建 src/hooks/useGameElements.ts**

```typescript
import { useRef, useCallback } from 'react'
import { GameElement, ElementType } from '../constants/enum'
import { LEVELS, SPEED_MULTIPLIERS, BASE_SPEED, ELEMENT_SPAWN_Y, ELEMENT_DESPAWN_Y, YENA_HAND_X, YENA_HAND_X_VARIANCE } from '../constants/game'

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
  const elementIdCounterRef = useRef<number>(0)

  const spawnElement = useCallback(function (
    elapsedTime: number,
    currentPhaseIndex: number,
    feverActive: boolean,
  ): GameElement | null {
    const phase = LEVELS[currentPhaseIndex]
    if (!phase) return null

    const now = performance.now()
    if (now - lastSpawnTimeRef.current < phase.spawnInterval * 1000) return null
    lastSpawnTimeRef.current = now

    // Fever 时不生成炸弹
    let bombProb = phase.bombProb
    let type: ElementType
    if (feverActive) {
      bombProb = 0
      // Fever 时全是爱心和道具
      const r = Math.random()
      if (r < phase.heartProb / (phase.heartProb + phase.itemProb)) {
        type = ElementType.HEART
      } else {
        type = ElementType.ITEM
      }
    } else {
      type = weightedRandom(phase.heartProb, phase.itemProb)
    }

    const speedMultiplier = SPEED_MULTIPLIERS[currentPhaseIndex] ?? 1.0
    const speed = BASE_SPEED * speedMultiplier

    const x = YENA_HAND_X + (Math.random() * 2 - 1) * YENA_HAND_X_VARIANCE

    const isHeart = type === ElementType.HEART
    const element: GameElement = {
      id: genId(),
      type,
      x,
      y: ELEMENT_SPAWN_Y,
      speed,
      swingPhase: isHeart ? Math.random() * Math.PI * 2 : 0,
      swingAmplitude: isHeart ? 0.03 : 0,
      spawnTime: now,
    }

    return element
  }, [])

  const updateElements = useCallback(function (elements: GameElement[], deltaTime: number): GameElement[] {
    const dt = deltaTime / 1000 // 转为秒
    return elements
      .map(el => {
        let newY = el.y + el.speed * dt
        let newX = el.x
        if (el.type === ElementType.HEART) {
          newX = el.x + Math.sin(el.swingPhase + el.speed * dt * Math.PI) * el.swingAmplitude
        }
        return { ...el, y: newY, x: newX }
      })
      .filter(el => el.y < ELEMENT_DESPAWN_Y)
  }, [])

  const removeElement = useCallback(function (elements: GameElement[], id: string): GameElement[] {
    return elements.filter(el => el.id !== id)
  }, [])

  const getCurrentPhaseIndex = useCallback(function (elapsedTime: number): number {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (elapsedTime >= LEVELS[i].startTime) return i
    }
    return 0
  }, [])

  return {
    elementsRef,
    spawnElement,
    updateElements,
    removeElement,
    getCurrentPhaseIndex,
    lastSpawnTimeRef,
    elementIdCounterRef,
  }
}
```

- [ ] **Step 3: 创建 src/hooks/useGameLoop.ts**

```typescript
import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import {
  addScore,
  setCombo,
  incrementFeverGauge,
  triggerStun,
  tick,
  endGame,
  endFever,
  endStun,
  endInvincible,
  recordCollect,
  showFloatScore,
  showComboTitle,
  clearLastScoreDelta,
  clearComboTitle,
} from '../store/slices/gameSlice'
import { SubState, ElementType } from '../constants/enum'
import { useGameInput } from './useGameInput'
import { useGameElements } from './useGameElements'
import { useCollision } from './useCollision'
import { useParticles } from './useParticles'
import {
  GAME_DURATION,
  ELEMENT_SIZE,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_MIN_X,
  PLAYER_MAX_X,
  COMBO_THRESHOLDS,
  FEVER_DURATION,
  COLLISION_OVERLAP_THRESHOLD,
} from '../constants/game'

const PLAYER_Y_NORM = 0.88 // 小人在归一化坐标系中的 y 位置

export function useGameLoop() {
  const dispatch = useDispatch()
  const { gameState, subState, combo, invincibleRemaining } = useSelector((s: RootState) => s.game)

  const { frameInputRef } = useGameInput()
  const { elementsRef, spawnElement, updateElements, removeElement, getCurrentPhaseIndex } = useGameElements()
  const { checkCollision } = useCollision()
  const { spawnParticles } = useParticles()

  const rafIdRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const playerXRef = useRef<number>(0.5)
  const targetPlayerXRef = useRef<number>(0.5)
  const feverTimerRef = useRef<number>(0)
  const stunTimerRef = useRef<number>(0)
  const invincibleTimerRef = useRef<number>(0)
  const comboRef = useRef<number>(0)
  const comboTitleShownRef = useRef<number>(0) // 已展示的最高等级
  const lastSecondRef = useRef<number>(-1)
  const isRunningRef = useRef<boolean>(false)

  const stopLoop = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = 0
    }
    isRunningRef.current = false
  }, [])

  const startLoop = useCallback(() => {
    if (isRunningRef.current) return
    isRunningRef.current = true
    lastTimeRef.current = performance.now()
    rafIdRef.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    if (gameState !== 4 satisfies any) {} // placeholder for actual condition
    // Actually handle state-based cleanup in the loop itself
  }, [])

  function loop(currentTime: number) {
    if (!isRunningRef.current) return

    const deltaTime = currentTime - lastTimeRef.current
    lastTimeRef.current = currentTime
    const dt = deltaTime

    // Read current game state from Redux via a ref mechanism
    // For now, we'll handle logic directly in the loop

    // 1. Input → targetPlayerX
    const fi = frameInputRef.current
    if (fi.pointerActive && fi.pointerX !== null) {
      targetPlayerXRef.current = fi.pointerX
    }
    // Ease player x toward target
    const dx = targetPlayerXRef.current - playerXRef.current
    playerXRef.current += dx * 0.2
    playerXRef.current = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X, playerXRef.current))

    // 2. Get elapsed time for phase lookup
    const state = document.querySelector('.game-stage')?.getAttribute('data-elapsed')
    const elapsedTime = state ? parseFloat(state) / 1000 : 0
    const phaseIndex = getCurrentPhaseIndex(elapsedTime)
    const feverActive = subState === SubState.FEVER

    // 3. Spawn
    const newEl = spawnElement(elapsedTime, phaseIndex, feverActive)
    if (newEl) {
      elementsRef.current = [...elementsRef.current, newEl]
    }

    // 4. Move
    elementsRef.current = updateElements(elementsRef.current, dt)

    // 5. Collision
    const playerBox = {
      x: playerXRef.current - PLAYER_WIDTH / 2000, // approx normalized
      y: PLAYER_Y_NORM - PLAYER_HEIGHT / 1334 / 2,
      w: PLAYER_WIDTH / 750,
      h: PLAYER_HEIGHT / 1334,
    }
    const playerXNorm = playerXRef.current

    elementsRef.current = elementsRef.current.filter(el => {
      const elBox = { x: el.x - 0.033, y: el.y - 0.037, w: 0.067, h: 0.037 }
      if (checkCollision(playerXNorm, el.x, el.y)) {
        // Collision!
        handleCollision(el, playerXNorm, elapsedTime)
        return false
      }
      return true
    })

    // 6. DOM update for elements (handled in GamePage via refs)
    // 7. Timer updates (ms-level)
    if (feverTimerRef.current > 0) {
      feverTimerRef.current -= dt
      if (feverTimerRef.current <= 0) {
        feverTimerRef.current = 0
        dispatch(endFever())
      }
    }
    if (stunTimerRef.current > 0) {
      stunTimerRef.current -= dt
      if (stunTimerRef.current <= 0) {
        stunTimerRef.current = 0
        dispatch(endStun())
      }
    }
    if (invincibleTimerRef.current > 0) {
      invincibleTimerRef.current -= dt
      if (invincibleTimerRef.current <= 0) {
        invincibleTimerRef.current = 0
        dispatch(endInvincible())
      }
    }

    // 8. Second-level tick
    const currentSecond = Math.floor(elapsedTime)
    if (currentSecond !== lastSecondRef.current && currentSecond >= 0) {
      lastSecondRef.current = currentSecond
      const remaining = Math.max(0, GAME_DURATION - elapsedTime)
      dispatch(tick({ remainingTime: remaining, elapsedTime }))
      if (remaining <= 0) {
        dispatch(endGame())
        stopLoop()
        return
      }
    }

    rafIdRef.current = requestAnimationFrame(loop)
  }

  function handleCollision(el: GameElement, playerX: number, elapsedTime: number) {
    const screenX = el.x * 750
    const screenY = el.y * 1334

    if (el.type === ElementType.BOMB) {
      if (invincibleRemaining <= 0 && subState !== SubState.STUNNED) {
        dispatch(addScore({ delta: -2, x: screenX, y: screenY }))
        dispatch(setCombo(0))
        comboRef.current = 0
        comboTitleShownRef.current = 0
        dispatch(recordCollect(ElementType.BOMB))
        dispatch(triggerStun())
        stunTimerRef.current = 5000
        invincibleTimerRef.current = 1500
        spawnParticles('bomb', el.x, el.y)
      }
    } else if (el.type === ElementType.HEART) {
      dispatch(addScore({ delta: 1, x: screenX, y: screenY }))
      comboRef.current += 1
      dispatch(setCombo(comboRef.current))
      checkAndShowComboTitle()
      dispatch(recordCollect(ElementType.HEART))
      spawnParticles('heart', el.x, el.y)
    } else if (el.type === ElementType.ITEM) {
      dispatch(addScore({ delta: 5, x: screenX, y: screenY }))
      comboRef.current += 1
      dispatch(setCombo(comboRef.current))
      checkAndShowComboTitle()
      dispatch(incrementFeverGauge())
      dispatch(recordCollect(ElementType.ITEM))
      spawnParticles('item', el.x, el.y)
    }
  }

  function checkAndShowComboTitle() {
    for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
      const t = COMBO_THRESHOLDS[i]
      if (comboRef.current >= t.minCombo && comboTitleShownRef.current < t.level) {
        comboTitleShownRef.current = t.level
        dispatch(showComboTitle(t.title))
        return
      }
    }
  }

  return { startLoop, stopLoop, isRunningRef, playerXRef, elementsRef }
}
```

> ⚠️ Note: `useGameLoop.ts` is the most complex file. The above is pseudocode — actual implementation will need careful synchronization with Redux state and the DOM. Key constraint: **no Redux dispatch per frame** — only on collision events, per-second timers, and state transitions.

- [ ] **Step 4: 提交**

```bash
git add src/hooks/useGameLoop.ts src/hooks/useGameElements.ts src/utils/math.ts
git commit -m "feat: add useGameLoop (core game loop) and useGameElements (spawn/move/despawn)
```

---

## Task 10: useCollision

**Files:**
- Create: `src/hooks/useCollision.ts`

**Interfaces:**
- Consumes: Task 5 常量
- Produces: `checkCollision(playerX, elementX, elementY): boolean`

- [ ] **Step 1: 创建 useCollision.ts**

```typescript
import { useCallback } from 'react'
import { COLLISION_OVERLAP_THRESHOLD, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_MIN_X, PLAYER_MAX_X } from '../constants/game'

const PLAYER_WIDTH_NORM = PLAYER_WIDTH / 750
const PLAYER_HEIGHT_NORM = PLAYER_HEIGHT / 1334
const ELEMENT_SIZE_NORM = 50 / 750
const PLAYER_Y_NORM = 0.88

export function useCollision() {
  const checkCollision = useCallback(function (
    playerXNorm: number,
    elementXNorm: number,
    elementYNorm: number,
  ): boolean {
    // Clamp player x to bounds
    const px = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X, playerXNorm))

    // Player bounding box (normalized)
    const pLeft = px - PLAYER_WIDTH_NORM / 2
    const pTop = PLAYER_Y_NORM - PLAYER_HEIGHT_NORM / 2
    const pRight = px + PLAYER_WIDTH_NORM / 2
    const pBottom = PLAYER_Y_NORM + PLAYER_HEIGHT_NORM / 2

    // Element bounding box
    const eLeft = elementXNorm - ELEMENT_SIZE_NORM / 2
    const eTop = elementYNorm - ELEMENT_SIZE_NORM / 2
    const eRight = elementXNorm + ELEMENT_SIZE_NORM / 2
    const eBottom = elementYNorm + ELEMENT_SIZE_NORM / 2

    // Overlap
    const overlapW = Math.max(0, Math.min(pRight, eRight) - Math.max(pLeft, eLeft))
    const overlapH = Math.max(0, Math.min(pBottom, eBottom) - Math.max(pTop, eTop))
    const overlapArea = overlapW * overlapH
    const minArea = PLAYER_WIDTH_NORM * PLAYER_HEIGHT_NORM // player is smaller, use as denominator
    const ratio = minArea > 0 ? overlapArea / minArea : 0

    return ratio >= COLLISION_OVERLAP_THRESHOLD
  }, [])

  return { checkCollision }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/hooks/useCollision.ts
git commit -m "feat: add useCollision with 50% overlap ratio check
```

---

## Task 11: useParticles

**Files:**
- Create: `src/hooks/useParticles.ts`

**Interfaces:**
- Consumes: Task 3 (Particle type), Task 5 常量
- Produces: `spawnParticles(type, x, y)` — 在 particlesRef 中追加粒子

- [ ] **Step 1: 创建 useParticles.ts**

```typescript
import { useRef, useCallback } from 'react'
import { Particle } from '../constants/enum'

let particleId = 0
function genId() {
  return `p_${++particleId}_${Date.now()}`
}

type ParticleEventType = 'heart' | 'item' | 'bomb' | 'fever'

const PARTICLE_CONFIGS: Record<ParticleEventType, Omit<Particle, 'id' | 'x' | 'y' | 'life' | 'maxLife'>[]> = {
  heart: [
    { vx: -1.5, vy: -2, color: '#ff6b9d', size: 12, shape: 'circle' },
    { vx: 0,   vy: -2.5, color: '#ffb3c6', size: 8,  shape: 'circle' },
    { vx: 1.5, vy: -2, color: '#ff6b9d', size: 10, shape: 'circle' },
    { vx: -1, vy: -1.5, color: '#ff8fab', size: 6,  shape: 'circle' },
    { vx: 1,  vy: -1.5, color: '#ff8fab', size: 6,  shape: 'circle' },
  ],
  item: [
    { vx: -2, vy: -3, color: '#ffd700', size: 12, shape: 'star' },
    { vx: 2,  vy: -3, color: '#ffd700', size: 12, shape: 'star' },
    { vx: -1, vy: -2, color: '#fff176', size: 8,  shape: 'star' },
    { vx: 1,  vy: -2, color: '#fff176', size: 8,  shape: 'star' },
    { vx: 0,  vy: -3.5, color: '#ffd700', size: 10, shape: 'star' },
  ],
  bomb: [
    { vx: -1.5, vy: -1, color: '#888', size: 16, shape: 'smoke' },
    { vx: 1.5,  vy: -1, color: '#888', size: 16, shape: 'smoke' },
    { vx: 0,    vy: -2, color: '#aaa', size: 12, shape: 'smoke' },
    { vx: -1,   vy: -1.5, color: '#999', size: 8,  shape: 'smoke' },
    { vx: 1,    vy: -1.5, color: '#999', size: 8,  shape: 'smoke' },
  ],
  fever: [], // Fever particles managed separately
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

    const now = performance.now()
    const newParticles: Particle[] = configs.map(cfg => ({
      id: genId(),
      x: xNorm,
      y: yNorm,
      vx: cfg.vx,
      vy: cfg.vy,
      life: 600,
      maxLife: 600,
      color: cfg.color,
      size: cfg.size,
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
```

- [ ] **Step 2: 提交**

```bash
git add src/hooks/useParticles.ts
git commit -m "feat: add useParticles for burst effects on collision
```

---

## Task 12: GamePage骨架 + HUD

**Files:**
- Create: `src/pages/GamePage/index.tsx`
- Create: `src/pages/GamePage/index.less`
- Create: `src/components/HUD/` (TimerDisplay, ScoreDisplay, ComboDisplay, FeverGauge)

**Interfaces:**
- Consumes: Task 6 (Redux state), Task 7 (布局)
- Produces: `GamePage` 壳子，内含 HUD 展示实时数据

- [ ] **Step 1: 创建 HUD 组件**

```tsx
// components/HUD/TimerDisplay.tsx
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

export function TimerDisplay() {
  const remainingTime = useSelector((s: RootState) => s.game.remainingTime)
  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60
  const isUrgent = remainingTime <= 10
  return (
    <div className={`hud-timer ${isUrgent ? 'urgent' : ''}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
}
```

```tsx
// components/HUD/ScoreDisplay.tsx
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

export function ScoreDisplay() {
  const score = useSelector((s: RootState) => s.game.score)
  return <div className="hud-score">{score}</div>
}
```

```tsx
// components/HUD/ComboDisplay.tsx
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

export function ComboDisplay() {
  const { combo, comboTitle } = useSelector((s: RootState) => s.game)
  if (combo === 0) return null
  return (
    <div className="hud-combo">
      <span className="combo-count">🔥{combo}</span>
    </div>
  )
}
```

```tsx
// components/HUD/FeverGauge.tsx
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { FEVER_MAX } from '../../constants/game'

export function FeverGauge() {
  const feverGauge = useSelector((s: RootState) => s.game.feverGauge)
  const feverCount = useSelector((s: RootState) => s.game.feverCount)
  const cells = Array.from({ length: FEVER_MAX }, (_, i) => i < feverGauge)
  return (
    <div className="hud-fever">
      <span className="fever-label">FEVER</span>
      <div className="fever-cells">
        {cells.map((filled, i) => (
          <div key={i} className={`fever-cell ${filled ? 'filled' : ''}`} />
        ))}
      </div>
      {feverCount > 0 && <span className="fever-count">×{feverCount}</span>}
    </div>
  )
}
```

```tsx
// components/HUD/index.tsx
import React from 'react'
import { TimerDisplay } from './TimerDisplay'
import { ScoreDisplay } from './ScoreDisplay'
import { ComboDisplay } from './ComboDisplay'
import { FeverGauge } from './FeverGauge'
import './HUD.less'

export default function HUD() {
  return (
    <div className="hud">
      <TimerDisplay />
      <ScoreDisplay />
      <ComboDisplay />
      <FeverGauge />
    </div>
  )
}
```

```less
// components/HUD/HUD.less
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);
  z-index: @z-hud;
}

.hud-timer {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
  &.urgent {
    color: #ff4444;
    animation: blink 1s steps(2) infinite;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.hud-score {
  font-size: 40px;
  font-weight: 700;
  color: #ffd700;
}

.hud-combo {
  font-size: 28px;
  color: #ff6b9d;
  font-weight: 700;
}

.hud-fever {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fever-label {
  font-size: 18px;
  color: #ffd700;
  font-weight: 700;
}

.fever-cells {
  display: flex;
  gap: 4px;
}

.fever-cell {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  &.filled {
    background: linear-gradient(135deg, #ffd700, #ff8a80);
  }
}
```

- [ ] **Step 2: 创建 GamePage 壳子**

```tsx
// src/pages/GamePage/index.tsx
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { pauseGame, resumeGame } from '../../store/slices/gameSlice'
import HUD from '../../components/HUD'
import { YenaStage } from './YenaStage'
import { CoreStage } from './CoreStage'
import { PlayerArea } from './PlayerArea'
import { CountdownOverlay } from './CountdownOverlay'
import FxLayer from '../../components/FxLayer'
import ModalLayer from '../../components/ModalLayer'
import { GameState } from '../../constants/enum'
import './index.less'

export default function GamePage() {
  const dispatch = useDispatch()
  const { gameState } = useSelector((s: RootState) => s.game)

  return (
    <div className="game-page">
      <HUD />
      <YenaStage />
      <CoreStage />
      <PlayerArea />
      <FxLayer />
      <ModalLayer />
      {gameState === GameState.COUNTDOWN && <CountdownOverlay />}
    </div>
  )
}
```

```less
// src/pages/GamePage/index.less
.game-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 750px;
  height: 1334px;
  overflow: hidden;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
```

- [ ] **Step 3: 创建 CountdownOverlay**

```tsx
// src/pages/GamePage/CountdownOverlay.tsx
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { countdownEnd } from '../../store/slices/gameSlice'
import { useCountdown } from '../../hooks/useCountdown'
import './CountdownOverlay.less'

export function CountdownOverlay() {
  const dispatch = useDispatch()
  const { count, isCounting } = useCountdown(3, () => {
    dispatch(countdownEnd())
  })

  if (!isCounting) return null

  return (
    <div className="countdown-overlay">
      <div className="countdown-number" key={count}>
        {count}
      </div>
    </div>
  )
}
```

```less
// src/pages/GamePage/CountdownOverlay.less
.countdown-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  z-index: 50;
}

.countdown-number {
  font-size: 200px;
  font-weight: 700;
  color: #fff;
  animation: countdownPop 1s ease-out;
}

@keyframes countdownPop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
```

- [ ] **Step 4: 提交**

```bash
git add src/components/HUD/ src/pages/GamePage/
git commit -m "feat: add GamePage shell with HUD components and countdown overlay
```

---

## Task 13: PlayerArea + PlayerSprite

**Files:**
- Create: `src/pages/GamePage/PlayerArea.tsx`
- Create: `src/pages/GamePage/PlayerSprite.tsx`

**Interfaces:**
- Consumes: Task 8 (useGameInput), Task 9 (playerXRef), Task 12 (GamePage壳子)
- Produces: 底部操作区 + 跟随触摸移动的小人

- [ ] **Step 1: 创建 PlayerSprite.tsx**

```tsx
import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { SubState } from '../../constants/enum'
import './PlayerSprite.less'

interface PlayerSpriteProps {
  xRef: React.MutableRefObject<number>
}

export function PlayerSprite({ xRef }: PlayerSpriteProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { subState, selectedSkin } = useSelector((s: RootState) => s.game)

  useEffect(() => {
    let rafId: number
    function update() {
      if (ref.current) {
        const x = xRef.current * 750
        ref.current.style.transform = `translateX(${x - 30}px)`
      }
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [xRef])

  const isStunned = subState === SubState.STUNNED

  return (
    <div
      ref={ref}
      className={`player-sprite ${isStunned ? 'stunned' : ''} skin-${selectedSkin}`}
      style={{ position: 'absolute', bottom: 80, left: 0 }}
    >
      <div className="player-body" />
      {isStunned && <div className="stun-stars" />}
    </div>
  )
}
```

```less
// PlayerSprite.less
.player-sprite {
  width: 60px;
  height: 60px;
  &.stunned {
    animation: shake 0.5s ease-in-out infinite;
  }
}

.player-body {
  width: 100%;
  height: 100%;
  border-radius: 30px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.5);
}

.skin-default .player-body { background: linear-gradient(135deg, #6c5ce7, #a29bfe); }
.skin-skin2 .player-body { background: linear-gradient(135deg, #00b894, #55efc4); }
.skin-skin3 .player-body { background: linear-gradient(135deg, #e17055, #fab1a0); }

.stun-stars {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: #ffd700;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  animation: spin 1s linear infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(-30px); }
  25% { transform: translateX(-40px); }
  75% { transform: translateX(-20px); }
}

@keyframes spin {
  from { transform: translateX(-50%) rotate(0deg); }
  to { transform: translateX(-50%) rotate(360deg); }
}
```

- [ ] **Step 2: 创建 PlayerArea.tsx**

```tsx
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { pauseGame } from '../../store/slices/gameSlice'
import { PlayerSprite } from './PlayerSprite'
import './PlayerArea.less'

interface PlayerAreaProps {
  playerXRef: React.MutableRefObject<number>
}

export function PlayerArea({ playerXRef }: PlayerAreaProps) {
  const dispatch = useDispatch()
  const { subState } = useSelector((s: RootState) => s.game)

  return (
    <div className="player-area">
      <button
        className="pause-btn"
        onClick={() => dispatch(pauseGame())}
        disabled={subState === 'STUNNED'}
      >
        ⏸️
      </button>
      <PlayerSprite xRef={playerXRef} />
    </div>
  )
}
```

```less
// PlayerArea.less
.player-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 12%;
  background: linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%);
  z-index: @z-player;
}

.pause-btn {
  position: absolute;
  top: 8px;
  left: 16px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-size: 28px;
  cursor: pointer;
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/pages/GamePage/PlayerArea.tsx src/pages/GamePage/PlayerSprite.tsx
git add src/pages/GamePage/PlayerArea.less src/pages/GamePage/PlayerSprite.less
git commit -m "feat: add PlayerArea with touch-controlled PlayerSprite and pause button
```

---

## Task 14: YenaStage

**Files:**
- Create: `src/pages/GamePage/YenaStage.tsx`

**Interfaces:**
- Consumes: Task 6 (Redux subState)
- Produces: Yena 立绘展示区，占位符为灰色 div + 动画

- [ ] **Step 1: 创建 YenaStage.tsx**

```tsx
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { SubState } from '../../constants/enum'
import './YenaStage.less'

export function YenaStage() {
  const subState = useSelector((s: RootState) => s.game.subState)
  const isFever = subState === SubState.FEVER
  const isStunned = subState === SubState.STUNNED

  return (
    <div className="yena-stage">
      <div className={`yena-character ${isFever ? 'fever' : ''} ${isStunned ? 'stunned' : ''}`}>
        <div className="yena-body">YENA</div>
        <div className="yena-arm" />
      </div>
    </div>
  )
}
```

```less
// YenaStage.less
.yena-stage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 25%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 5;
}

.yena-character {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}

.yena-body {
  width: 300px;
  height: 250px;
  background: rgba(255, 107, 157, 0.3);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: rgba(255,255,255,0.5);
  border: 2px dashed rgba(255,107,157,0.5);
}

.yena-arm {
  width: 60px;
  height: 80px;
  background: rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  position: absolute;
  bottom: 20px;
  right: 100px;
  animation: throwArm 1.2s ease-in-out infinite;
}

@keyframes throwArm {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-30deg) translateY(-20px); }
}

.yena-character.fever .yena-body {
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.5);
  animation: feverGlow 0.5s ease-in-out infinite alternate;
}

@keyframes feverGlow {
  from { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
  to { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
}

.yena-character.stunned .yena-body {
  background: rgba(128, 128, 128, 0.3);
  border-color: rgba(128, 128, 128, 0.5);
  animation: stunSpin 2s linear infinite;
}

@keyframes stunSpin {
  from { filter: hue-rotate(0deg); }
  to { filter: hue-rotate(360deg); }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/GamePage/YenaStage.tsx src/pages/GamePage/YenaStage.less
git commit -m "feat: add YenaStage with placeholder character and animations
```

---

## Task 15: CoreStage（元素舞台）

**Files:**
- Create: `src/pages/GamePage/CoreStage.tsx`

**Interfaces:**
- Consumes: Task 9 (elementsRef), Task 11 (particlesRef), Task 10 (collision)
- Produces: 游戏舞台 DOM，元素和粒子通过 ref 直接操作 transform

- [ ] **Step 1: 创建 CoreStage.tsx**

```tsx
import React, { useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { GameElement, Particle } from '../../constants/enum'
import './CoreStage.less'

interface CoreStageProps {
  elementsRef: React.MutableRefObject<GameElement[]>
  particlesRef: React.MutableRefObject<Particle[]>
}

export function CoreStage({ elementsRef, particlesRef }: CoreStageProps) {
  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const particleRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const prevElementsRef = useRef<GameElement[]>([])
  const prevParticlesRef = useRef<Particle[]>([])

  // Sync elements to DOM
  useEffect(() => {
    const currentIds = new Set(elementsRef.current.map(el => el.id))
    const prevIds = new Set(prevElementsRef.current.map(el => el.id))

    // Remove stale
    prevIds.forEach(id => {
      if (!currentIds.has(id)) {
        const node = elementRefs.current.get(id)
        if (node) node.style.display = 'none'
      }
    })

    // Add new
    currentIds.forEach(id => {
      if (!prevIds.has(id)) {
        // Create element node if not exists
        let node = elementRefs.current.get(id)
        if (!node && containerRef.current) {
          node = document.createElement('div')
          node.className = 'game-element'
          containerRef.current.appendChild(node)
          elementRefs.current.set(id, node)
        }
      }
    })

    prevElementsRef.current = [...elementsRef.current]
  })

  // Render loop
  useEffect(() => {
    let rafId: number
    function render() {
      elementsRef.current.forEach(el => {
        const node = elementRefs.current.get(el.id)
        if (node) {
          node.style.transform = `translate(${el.x * 750 - 25}px, ${el.y * 1334}px)`
          node.className = `game-element element-${el.type}`
          node.style.display = el.y >= 1.1 ? 'none' : 'block'
        }
      })

      particlesRef.current.forEach(p => {
        const node = particleRefs.current.get(p.id)
        if (node) {
          node.style.transform = `translate(${p.x * 750}px, ${p.y * 1334}px)`
          node.style.opacity = String(p.life / p.maxLife)
          node.style.display = p.life <= 0 ? 'none' : 'block'
        }
      })

      rafId = requestAnimationFrame(render)
    }
    rafId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafId)
  }, [elementsRef, particlesRef])

  return (
    <div ref={containerRef} className="core-stage">
      <div className="elements-container" />
      <div className="particles-container" />
    </div>
  )
}
```

```less
// CoreStage.less
.core-stage {
  position: absolute;
  top: 25%;
  left: 0;
  right: 0;
  bottom: 12%;
  z-index: 1;
}

.game-element {
  position: absolute;
  top: 0;
  left: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  transition: none;
}

.element-heart {
  background: radial-gradient(circle, #ff6b9d 0%, #ff8fab 100%);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.4);
}

.element-item {
  background: radial-gradient(circle, #ffd700 0%, #ff8a80 100%);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  transform-origin: center;
}

.element-bomb {
  background: radial-gradient(circle, #333 0%, #111 100%);
  border: 3px solid #ff4444;
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
}
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/GamePage/CoreStage.tsx src/pages/GamePage/CoreStage.less
git commit -m "feat: add CoreStage with DOM element pooling for game entities
```

---

## Task 16: Fever/眩晕/无敌逻辑集成

**Files:**
- Modify: `src/hooks/useGameLoop.ts`
- Modify: `src/store/slices/gameSlice.ts` (已有 actions)

**说明:** Fever/眩晕/无敌逻辑大部分已在 Task 6 的 gameSlice 和 Task 9 的 useGameLoop 中实现，此任务主要是确保它们正确串联：

- Fever 触发：`incrementFeverGauge` 满 8 格 → `triggerFever()` → `subState === FEVER`
- Fever 期间：`spawnElement` 不生成炸弹，`addScore` 双倍
- Fever 结束：`feverTimerRef` 倒计时归零 → `dispatch(endFever())`
- 眩晕触发：接到炸弹 → `triggerStun()` → `subState === STUNNED` → `stunTimerRef = 5000`
- 眩晕期间：所有输入被忽略（useGameInput 可增加眩晕屏蔽）
- 眩晕结束 → 无敌 1.5s → `invincibleRemaining > 0` 时炸弹不触发新眩晕

- [ ] **Step 1: 修改 useGameInput 增加眩晕屏蔽**

```typescript
// 在 useGameInput 中增加 subState 参数
// 眩晕期间 pointerActive 始终为 false
```

- [ ] **Step 2: 验证 useGameLoop 中的 Fever 时间逻辑**

检查 `feverTimerRef` 在 `triggerFever()` 时设置为 `FEVER_DURATION`，每帧递减，归零时 dispatch `endFever()`

- [ ] **Step 3: 提交**

```bash
git add src/hooks/useGameLoop.ts
git commit -m "feat: integrate Fever/Stun/Invincible logic into game loop
```

---

## Task 17: FxLayer（浮动分数/Combo称号）

**Files:**
- Create: `src/components/FxLayer/index.tsx`
- Create: `src/components/FxLayer/index.less`

**Interfaces:**
- Consumes: Task 6 (lastScoreDelta, comboTitle from Redux)
- Produces: 浮动分数文字 + Combo 称号弹出动画

- [ ] **Step 1: 创建 FxLayer/index.tsx**

```tsx
import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { clearLastScoreDelta, clearComboTitle } from '../../store/slices/gameSlice'
import './index.less'

export default function FxLayer() {
  const dispatch = useDispatch()
  const { lastScoreDelta, comboTitle, subState } = useSelector((s: RootState) => s.game)
  const floatRef = useRef<HTMLDivElement>(null)
  const comboRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lastScoreDelta) {
      if (floatRef.current) {
        floatRef.current.style.transform = `translate(${lastScoreDelta.x}px, ${lastScoreDelta.y}px)`
        floatRef.current.className = 'float-score-text visible'
        floatRef.current.textContent = lastScoreDelta.value >= 0 ? `+${lastScoreDelta.value}` : String(lastScoreDelta.value)
      }
      const timer = setTimeout(() => {
        dispatch(clearLastScoreDelta())
        if (floatRef.current) floatRef.current.className = 'float-score-text'
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [lastScoreDelta, dispatch])

  useEffect(() => {
    if (comboTitle) {
      if (comboRef.current) {
        comboRef.current.className = 'combo-title-popup visible'
        comboRef.current.textContent = comboTitle
      }
      const timer = setTimeout(() => {
        dispatch(clearComboTitle())
        if (comboRef.current) comboRef.current.className = 'combo-title-popup'
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [comboTitle, dispatch])

  const isFever = subState === 'FEVER'
  const isStunned = subState === 'STUNNED'

  return (
    <div className="fx-layer">
      <div ref={floatRef} className="float-score-text" />
      <div ref={comboRef} className="combo-title-popup" />
      {isFever && <div className="fever-overlay">FEVER!</div>}
      {isStunned && <div className="stun-overlay" />}
    </div>
  )
}
```

```less
// index.less
.fx-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: @z-fx;
}

.float-score-text {
  position: absolute;
  font-size: 32px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  opacity: 0;
  transition: none;
  &.visible {
    animation: floatUp 800ms ease-out forwards;
  }
}

@keyframes floatUp {
  0%   { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-60px); }
}

.combo-title-popup {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  font-size: 56px;
  font-weight: 700;
  color: #ff6b9d;
  text-shadow: 0 4px 20px rgba(255, 107, 157, 0.6);
  opacity: 0;
  white-space: nowrap;
  &.visible {
    animation: comboPop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
}

@keyframes comboPop {
  0%   { opacity: 1; transform: translate(-50%, -50%) scale(0); }
  70%  { transform: translate(-50%, -50%) scale(1.2); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.fever-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 100px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
  animation: feverFlash 1200ms ease-out forwards;
  pointer-events: none;
}

@keyframes feverFlash {
  0%   { opacity: 1; transform: scale(0.5); }
  30%  { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1) translateY(-100px); }
}

.stun-overlay {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 100px rgba(255, 0, 0, 0.4);
  animation: stunPulse 200ms ease-in forwards;
  pointer-events: none;
}

@keyframes stunPulse {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/FxLayer/
git commit -m "feat: add FxLayer for float score, combo title, fever and stun overlays
```

---

## Task 18: ModalLayer + PauseModal

**Files:**
- Create: `src/components/ModalLayer/index.tsx`
- Create: `src/components/ModalLayer/PauseModal.tsx`
- Create: `src/components/ModalLayer/index.less`

**Interfaces:**
- Consumes: Task 6 (Redux gameState)
- Produces: 暂停弹窗，遮罩背景 + 继续/退出按钮

- [ ] **Step 1: 创建 ModalLayer/index.tsx**

```tsx
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { GameState } from '../../constants/enum'
import PauseModal from './PauseModal'
import ResultModal from './ResultModal'
import './index.less'

export default function ModalLayer() {
  const { gameState } = useSelector((s: RootState) => s.game)

  if (gameState !== GameState.PAUSED && gameState !== GameState.RESULT) return null

  return (
    <div className="modal-layer">
      <div className="modal-backdrop" />
      {gameState === GameState.PAUSED && <PauseModal />}
      {gameState === GameState.RESULT && <ResultModal />}
    </div>
  )
}
```

```less
// index.less
.modal-layer {
  position: absolute;
  inset: 0;
  z-index: @z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  animation: fadeIn 300ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 2: 创建 PauseModal.tsx**

```tsx
import React from 'react'
import { useDispatch } from 'react-redux'
import { resumeGame, resetToIdle } from '../../store/slices/gameSlice'

export default function PauseModal() {
  const dispatch = useDispatch()

  return (
    <div className="modal-panel pause-modal">
      <div className="modal-title">游戏暂停</div>
      <div className="modal-buttons">
        <button
          className="modal-btn primary"
          onClick={() => dispatch(resumeGame())}
        >
          继续游戏
        </button>
        <button
          className="modal-btn secondary"
          onClick={() => dispatch(resetToIdle())}
        >
          退出本局
        </button>
      </div>
    </div>
  )
}
```

```less
// PauseModal.less
.modal-panel {
  position: relative;
  z-index: 1;
  width: 500px;
  padding: 48px 40px;
  background: rgba(30, 30, 60, 0.95);
  border-radius: 24px;
  border: 2px solid rgba(255,255,255,0.1);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: panelIn 300ms ease-out;
  text-align: center;
}

@keyframes panelIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.modal-title {
  font-size: 40px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 40px;
}

.modal-buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-btn {
  height: 72px;
  border-radius: 36px;
  border: none;
  font-size: 26px;
  font-weight: 700;
  cursor: pointer;
  &.primary {
    background: linear-gradient(135deg, #ff6b9d, #ff8a80);
    color: #fff;
    box-shadow: 0 8px 24px rgba(255, 107, 157, 0.4);
  }
  &.secondary {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.7);
    border: 2px solid rgba(255,255,255,0.2);
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/ModalLayer/
git commit -m "feat: add ModalLayer with PauseModal
```

---

## Task 19: ResultModal（结算）

**Files:**
- Create: `src/components/ModalLayer/ResultModal.tsx`
- Create: `src/components/ModalLayer/ResultModal.less`

**Interfaces:**
- Consumes: Task 6 (Redux score/maxCombo/feverCount/collected*)
- Produces: 结算弹窗：星级 + 统计 + 再来一局/退出

- [ ] **Step 1: 创建 ResultModal.tsx**

```tsx
import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { startGame, resetToIdle } from '../../store/slices/gameSlice'
import { STAR_THRESHOLDS } from '../../constants/game'
import './ResultModal.less'

const STAR_LABELS = ['太厉害了！', '做得不错！', '继续加油！', '再来一次！', '下次会更好！']

export default function ResultModal() {
  const dispatch = useDispatch()
  const { score, maxCombo, feverCount, collectedHearts, collectedItems, hitBombs } =
    useSelector((s: RootState) => s.game)

  const stars = useMemo(() => {
    for (const t of [...STAR_THRESHOLDS].reverse()) {
      if (score >= t.minScore) return t.stars
    }
    return 1
  }, [score])

  const starLabel = STAR_LABELS[5 - stars] ?? STAR_LABELS[STAR_LABELS.length - 1]

  return (
    <div className="modal-panel result-modal">
      <div className="stars-row">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`star ${i <= stars ? 'on' : 'off'}`}>
            {i <= stars ? '★' : '☆'}
          </span>
        ))}
      </div>
      <div className="result-label">{starLabel}</div>
      <div className="result-score">总分: {score}</div>
      <div className="result-stats">
        <div className="stat">最高 Combo: {maxCombo}</div>
        <div className="stat">Fever: {feverCount} 次</div>
        <div className="stat-row">
          <span>💖 {collectedHearts}</span>
          <span>🎁 {collectedItems}</span>
          <span>💣 {hitBombs}</span>
        </div>
      </div>
      <div className="modal-buttons">
        <button className="modal-btn primary" onClick={() => dispatch(startGame())}>
          再来一局
        </button>
        <button className="modal-btn secondary" onClick={() => dispatch(resetToIdle())}>
          返回主界面
        </button>
      </div>
    </div>
  )
}
```

```less
// ResultModal.less
.result-modal {
  width: 550px;
}

.stars-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.star {
  font-size: 52px;
  &.on { color: #ffd700; }
  &.off { color: rgba(255,255,255,0.2); }
  animation: starPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  &:nth-child(1) { animation-delay: 200ms; }
  &:nth-child(2) { animation-delay: 400ms; }
  &:nth-child(3) { animation-delay: 600ms; }
  &:nth-child(4) { animation-delay: 800ms; }
  &:nth-child(5) { animation-delay: 1000ms; }
}

@keyframes starPop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.result-label {
  font-size: 28px;
  color: rgba(255,255,255,0.8);
  text-align: center;
  margin-bottom: 16px;
}

.result-score {
  font-size: 56px;
  font-weight: 700;
  color: #ffd700;
  text-align: center;
  margin-bottom: 24px;
}

.result-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  text-align: center;
  font-size: 22px;
  color: rgba(255,255,255,0.7);
}

.stat-row {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 26px;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/ModalLayer/ResultModal.tsx src/components/ModalLayer/ResultModal.less
git commit -m "feat: add ResultModal with star rating and statistics
```

---

## Task 20: useGameAudio

**Files:**
- Create: `src/hooks/useGameAudio.ts`

**Interfaces:**
- Consumes: Task 2（已配置）
- Produces: `playBGM`, `stopBGM`, `playSFX(type)` — Web Audio API 合成音效

> ⚠️ 音频为可选功能，Web Audio 合成可在无音频文件时提供基础音效反馈。

- [ ] **Step 1: 创建 useGameAudio.ts**

```typescript
import { useRef, useCallback } from 'react'

type SfxType = 'heart' | 'item' | 'bomb' | 'fever' | 'combo' | 'stun' | 'tick'

const SFX_CONFIG: Record<SfxType, { freq: number; duration: number; type: OscillatorType; gain: number }> = {
  heart:  { freq: 880, duration: 0.1, type: 'sine', gain: 0.3 },
  item:   { freq: 1320, duration: 0.15, type: 'triangle', gain: 0.4 },
  bomb:   { freq: 120, duration: 0.3, type: 'sawtooth', gain: 0.5 },
  fever:  { freq: 1760, duration: 0.5, type: 'sine', gain: 0.4 },
  combo:  { freq: 660, duration: 0.1, type: 'triangle', gain: 0.3 },
  stun:   { freq: 200, duration: 0.4, type: 'square', gain: 0.3 },
  tick:   { freq: 440, duration: 0.05, type: 'square', gain: 0.2 },
}

export function useGameAudio() {
  const ctxRef = useRef<AudioContext | null>(null)

  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
  }

  const playSFX = useCallback(function (type: SfxType) {
    try {
      const ctx = getCtx()
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
      // AudioContext not available or blocked
    }
  }, [])

  return { playSFX }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/hooks/useGameAudio.ts
git commit -m "feat: add useGameAudio with Web Audio API synthesis for SFX
```

---

## Task 21: 素材占位符替换（占位阶段）

**说明:** 素材尚未提供，此任务标记为占位符状态，待素材到位后替换。

- [ ] 确认 `public/assets/imgs/` 和 `public/assets/audio/` 目录存在但为空
- [ ] 将 `YenaStage.tsx` 中的灰色 div 替换为 `<img src="/assets/imgs/yena-default.png" />`
- [ ] 将 `PlayerSprite.tsx` 中的纯色 div 替换为 `<img src="/assets/imgs/player-${selectedSkin}.png" />`
- [ ] 将 `CoreStage.less` 中的 `.element-*` 背景替换为对应的图标图片
- [ ] BGM/Audio 元素接入 `<audio src="">` 或 `AudioContext`

**暂不实现，待素材到位。**

---

## Task 22: 集成测试 + 收尾

**验证清单:**
- [ ] HomePage 点击开始 → 进入 COUNTDOWN → 3-2-1 → PLAYING
- [ ] 底部触摸/鼠标拖动 → 小人跟随
- [ ] 元素从顶部生成并下落
- [ ] 接住爱心 → 分数+1，浮动分数弹出
- [ ] 接住道具 → 分数+5，浮动分数弹出
- [ ] 接到炸弹 → 分数-2，眩晕5秒，操作失效
- [ ] Combo 达到 3/7/15/25/40 → 对应称号弹出
- [ ] Fever 槽满8格 → FEVER! 大字弹出，10秒双倍
- [ ] Fever 期间 → 无炸弹生成
- [ ] 180秒倒计时归零 → 结算弹窗弹出
- [ ] 结算弹窗显示星级、统计
- [ ] 再来一局 → 重新开始
- [ ] 暂停按钮 → 暂停弹窗 → 继续/退出
- [ ] 不同屏幕尺寸下游戏舞台等比缩放居中

- [ ] **提交最终版本**

```bash
git add -A
git commit -m "feat: kg_yena_catch complete implementation
```

---

## Self-Review 检查

**Spec Coverage:**
- ✅ 游戏时长 180s — Task 5 常量 + Task 9 游戏循环
- ✅ 四阶段掉落参数 — Task 5 levels.ts
- ✅ Combo 五级阈值 — Task 5 game.ts + Task 9 handleCollision
- ✅ Fever 8格/10秒/双倍 — Task 6 gameSlice + Task 9
- ✅ 眩晕5秒+1.5秒无敌 — Task 6 + Task 9
- ✅ 结算星级 — Task 19 ResultModal
- ✅ 屏幕等比缩放 — Task 4 GameViewport
- ✅ 触摸+鼠标输入 — Task 8 useGameInput
- ✅ 粒子爆散 — Task 11 useParticles
- ✅ 音效合成 — Task 20 useGameAudio

**Placeholder Scan:**
- ⚠️ Task 9 useGameLoop.ts 代码为伪代码风格，需实际编写时补充完整
- ⚠️ Task 21 标记为"待素材"，未实现

**Type Consistency:**
- ✅ `ElementType` 枚举在 enum.ts / useGameElements / useCollision 中一致使用
- ✅ `FrameInput` 在 useGameInput 产出 / useGameLoop 消费名称一致
- ✅ `gameSlice` actions 与 gameSlice.ts 定义一致
