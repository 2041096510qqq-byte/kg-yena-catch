# Character, Particle, and Spawn Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 放大底部玩家和碰撞粒子，将 Yena 收回顶部窗框内，并让元素在画面 8%–92% 的横向范围生成。

**Architecture:** 所有可复用视觉数值集中到 `src/constants/game.ts`；元素和粒子 hooks 只消费常量并生成运行时数据；角色组件和样式只负责渲染。新增一个源码布局契约脚本，在没有浏览器测试框架的项目中对关键数值及其接线方式做可重复回归检查。

**Tech Stack:** React 18、TypeScript 5、Less、Vite 5、Node.js ESM 校验脚本

## Global Constraints

- 玩家视觉尺寸必须为 `120px`，现有 60×60px 碰撞框保持不变。
- 碰撞粒子尺寸倍率必须为 `2.2`，数量、速度、方向和 600ms 生命周期保持不变。
- `YenaStage` 高度必须为 `25%`，图片高度为容器的 `88%`，顶部对齐。
- 元素横向生成范围必须均匀覆盖 `[0.08, 0.92]`。
- 游戏时长保持 180 秒，眩晕保持 2 秒。
- 不修改得分、掉落速度、元素概率或 Fever 规则。
- 当前工作区包含既有未提交修改；实施阶段只编辑列出的文件，不创建混合提交。

---

### Task 1: 建立布局契约回归检查

**Files:**
- Create: `scripts/verify-game-layout.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `src/constants/game.ts`、`src/hooks/useGameElements.ts`、`src/hooks/useParticles.ts`、`src/pages/GamePage/PlayerSprite.tsx`、`src/pages/GamePage/YenaStage.less` 的源码文本。
- Produces: `npm run verify:layout`，不满足任一布局契约时以非零状态退出。

- [ ] **Step 1: 写入会失败的布局契约脚本**

```js
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const sources = {
  game: read('src/constants/game.ts'),
  elements: read('src/hooks/useGameElements.ts'),
  particles: read('src/hooks/useParticles.ts'),
  player: read('src/pages/GamePage/PlayerSprite.tsx'),
  yena: read('src/pages/GamePage/YenaStage.less'),
}

const checks = [
  ['player visual size is 120', sources.game, /PLAYER_VISUAL_SIZE\s*=\s*120/],
  ['particle scale is 2.2', sources.game, /PARTICLE_SIZE_SCALE\s*=\s*2\.2/],
  ['spawn minimum is 0.08', sources.game, /ELEMENT_SPAWN_MIN_X\s*=\s*0\.08/],
  ['spawn maximum is 0.92', sources.game, /ELEMENT_SPAWN_MAX_X\s*=\s*0\.92/],
  ['player rendering centers with visual size', sources.player, /xRef\.current\s*\*\s*750\s*-\s*PLAYER_VISUAL_SIZE\s*\/\s*2/],
  ['element spawning uses both bounds', sources.elements, /ELEMENT_SPAWN_MIN_X\s*\+\s*Math\.random\(\)\s*\*\s*\(ELEMENT_SPAWN_MAX_X\s*-\s*ELEMENT_SPAWN_MIN_X\)/],
  ['particle creation applies scale', sources.particles, /size:\s*cfg\.size\s*\*\s*PARTICLE_SIZE_SCALE/],
  ['Yena stage is 25 percent high', sources.yena, /\.yena-stage[\s\S]*?height:\s*25%/],
  ['Yena aligns from top', sources.yena, /\.yena-stage[\s\S]*?align-items:\s*flex-start/],
  ['Yena image uses 88 percent height', sources.yena, /\.yena-img[\s\S]*?height:\s*88%/],
]

const failures = checks.filter(([, source, pattern]) => !pattern.test(source))
if (failures.length > 0) {
  for (const [label] of failures) console.error(`FAIL: ${label}`)
  process.exit(1)
}

console.log(`verified ${checks.length} game layout contracts`)
```

在 `package.json` 的 `scripts` 中加入：

```json
"verify:layout": "node scripts/verify-game-layout.mjs"
```

- [ ] **Step 2: 运行检查并确认旧实现失败**

Run: `npm run verify:layout`

Expected: FAIL，至少报告缺少 `PLAYER_VISUAL_SIZE`、`PARTICLE_SIZE_SCALE`、`ELEMENT_SPAWN_MIN_X` 和 `ELEMENT_SPAWN_MAX_X`。

---

### Task 2: 集中视觉常量并接入玩家、粒子和元素生成

**Files:**
- Modify: `src/constants/game.ts`
- Modify: `src/hooks/useGameElements.ts`
- Modify: `src/hooks/useParticles.ts`
- Modify: `src/pages/GamePage/PlayerSprite.tsx`
- Modify: `src/pages/GamePage/PlayerSprite.less`

**Interfaces:**
- Consumes: `PLAYER_VISUAL_SIZE`、`PARTICLE_SIZE_SCALE`、`ELEMENT_SPAWN_MIN_X`、`ELEMENT_SPAWN_MAX_X`。
- Produces: 120px 玩家视觉、2.2 倍粒子、`[0.08, 0.92]` 均匀生成范围。

- [ ] **Step 1: 在游戏常量中定义新数值**

在 `src/constants/game.ts` 中加入：

```ts
export const PLAYER_VISUAL_SIZE = 120
export const PARTICLE_SIZE_SCALE = 2.2
export const ELEMENT_SPAWN_MIN_X = 0.08
export const ELEMENT_SPAWN_MAX_X = 0.92
```

删除不再使用的 `YENA_HAND_X` 和 `YENA_HAND_X_VARIANCE`，保留 60×60px 的 `PLAYER_WIDTH` 与 `PLAYER_HEIGHT`。

- [ ] **Step 2: 让玩家图片和水平居中计算共用视觉尺寸**

在 `PlayerSprite.tsx` 中导入 `PLAYER_VISUAL_SIZE`，并将定位改为：

```ts
const x = xRef.current * 750 - PLAYER_VISUAL_SIZE / 2
```

图片属性改为：

```tsx
width={PLAYER_VISUAL_SIZE}
height={PLAYER_VISUAL_SIZE}
```

`PlayerSprite.less` 中 `.player-sprite` 和 `.player-img` 的宽高都改为 `120px`。保持 `.player-sprite.stunned .player-img` 的眩晕动画选择器不变。

- [ ] **Step 3: 扩大元素横向随机范围**

`useGameElements.ts` 改为导入两个边界常量，并使用：

```ts
const x = ELEMENT_SPAWN_MIN_X
  + Math.random() * (ELEMENT_SPAWN_MAX_X - ELEMENT_SPAWN_MIN_X)
```

其他元素类型、速度、纵坐标和爱心摇摆逻辑保持不变。

- [ ] **Step 4: 在粒子创建时统一应用倍率**

`useParticles.ts` 导入 `PARTICLE_SIZE_SCALE`，并将粒子尺寸赋值改为：

```ts
size: cfg.size * PARTICLE_SIZE_SCALE,
```

不修改 `PARTICLE_CONFIGS` 中的原始尺寸、速度或数量。

- [ ] **Step 5: 运行布局契约并确认逻辑部分仍只剩 Yena 样式失败**

Run: `npm run verify:layout`

Expected: FAIL，仅报告 Yena 高度或对齐相关契约。

---

### Task 3: 将 Yena 立绘收回窗框并完成全量验证

**Files:**
- Modify: `src/pages/GamePage/YenaStage.less`

**Interfaces:**
- Consumes: 750×1334 固定画布和四种共用 `.yena-img` 的角色状态。
- Produces: 25% 高、顶部对齐、图片高度 88% 的稳定窗框布局。

- [ ] **Step 1: 调整 Yena 容器和图片**

将 `YenaStage.less` 的相关规则改为：

```less
.yena-stage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 25%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 5;
}

.yena-img {
  height: 88%;
  object-fit: contain;
}
```

保留 Fever 动画和 stunned 滤镜。

- [ ] **Step 2: 运行布局契约、素材校验和生产构建**

Run: `npm run verify:layout`

Expected: `verified 10 game layout contracts`

Run: `npm run verify:assets`

Expected: `verified 28 image assets`

Run: `npm run build`

Expected: TypeScript 和 Vite 构建成功。

- [ ] **Step 3: 浏览器视觉回归**

在 `http://localhost:5173/` 开始游戏并检查：

1. 玩家实际显示宽度约为原来的 1.5 倍，横向位置仍以中心对齐。
2. Yena 可见身体不越过背景窗台，四种图片切换不改变布局框。
3. 等待碰撞时粒子清晰可见，尺寸明显大于旧版。
4. 观察多次生成，元素横坐标可进入左右各 20% 区域。
5. 页面没有破图，正式计时仍从 03:00 开始，眩晕仍为 2 秒。

- [ ] **Step 4: 检查补丁完整性**

Run: `git diff --check`

Expected: 无输出，退出状态为 0。
