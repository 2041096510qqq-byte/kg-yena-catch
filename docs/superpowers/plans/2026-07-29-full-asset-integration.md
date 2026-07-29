# 全量图片素材接入实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已交付 PNG 全量接入主页、游戏、HUD、弹窗和特效，并确保新版下落元素透明、粒子能够实际渲染。

**Architecture:** 使用 `ASSETS` 作为唯一素材路径入口，图片按钮复用 `ImageButton`。元素与粒子继续使用现有 DOM/rAF 渲染，但粒子生成、更新、渲染共享同一组 refs；状态型 UI 仍由 Redux 驱动。

**Tech Stack:** React 18、TypeScript 5、Redux Toolkit、Less、Vite 5、Node.js

## Global Constraints

- 所有运行时图片文件名使用英文 kebab-case。
- 新版 `爱心.png`、`道具.png`、`炸弹.png` 是正式透明下落元素。
- 旧下划线元素文件移动到 `public/assets/imgs/legacy/`，不删除。
- 不改变 750×1334 坐标、碰撞、掉落速度、2 秒眩晕、得分、Combo 或 Fever 规则。
- 不接入音频，不新增未交付皮肤，不修改 PNG 内容。
- 保留当前工作区中与本任务无关的用户改动。

---

## 文件结构

- `scripts/verify-assets.mjs`：验证规范素材文件存在且非空。
- `src/constants/assets.ts`：唯一运行时素材路径表。
- `src/components/ImageButton.tsx` / `ImageButton.less`：可访问的图片按钮。
- `src/pages/HomePage/*`：主页 Banner、背景和按钮。
- `src/pages/GamePage/*`：角色、元素、玩家、暂停按钮和游戏背景。
- `src/components/HUD/*`：Fever 图片格。
- `src/components/ModalLayer/*`：弹窗背景、星级、图片按钮和分享。
- `src/hooks/useGameLoop.ts` / `src/pages/GamePage/index.tsx`：共享粒子 refs。
- `src/pages/GamePage/CoreStage.tsx` / `src/components/FxLayer/*`：碰撞粒子、Fever 金光和眩晕星星。

### Task 1: 规范素材目录与集中素材表

**Files:**

- Create: `scripts/verify-assets.mjs`
- Create: `src/constants/assets.ts`
- Modify: `package.json`
- Move: `public/assets/imgs/*`（按规格映射）

**Interfaces:**

- Consumes: `public/assets/imgs/` 当前中文和下划线文件。
- Produces: `ASSETS` 只读对象，以及 `npm run verify:assets`。

- [ ] **Step 1: 写素材文件契约检查**

创建 `scripts/verify-assets.mjs`：

```js
import { stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const names = [
  'game-background.png',
  'yena-normal.png', 'yena-throw.png', 'yena-fever.png', 'yena-angry.png',
  'player-default.png',
  'element-heart.png', 'element-item.png', 'element-bomb.png',
  'ui-title-banner.png', 'ui-button-start.png', 'ui-icon-play.png',
  'ui-button-skin.png', 'ui-button-pause.png', 'ui-modal-background.png',
  'ui-button-resume.png', 'ui-button-quit.png', 'ui-button-retry.png',
  'ui-button-share.png', 'ui-star-on.png', 'ui-star-off.png',
  'ui-fever-full.png', 'ui-fever-empty.png',
  'effect-stun-star.png', 'particle-heart.png', 'particle-star.png',
  'particle-smoke.png', 'particle-sparkle.png',
]

const root = fileURLToPath(new URL('../public/assets/imgs/', import.meta.url))
const failures = []
for (const name of names) {
  try {
    const info = await stat(`${root}/${name}`)
    if (!info.isFile() || info.size === 0) failures.push(`${name}: empty`)
  } catch {
    failures.push(`${name}: missing`)
  }
}
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`verified ${names.length} image assets`)
}
```

在 `package.json` 增加：

```json
"verify:assets": "node scripts/verify-assets.mjs"
```

- [ ] **Step 2: 运行契约检查并确认 RED**

Run: `npm run verify:assets`

Expected: FAIL，报告 `game-background.png` 等规范文件缺失。

- [ ] **Step 3: 显式迁移文件**

先确认所有目标路径不存在，再创建 `legacy/` 并逐个移动。关键命令：

```bash
mkdir -p public/assets/imgs/legacy
mv public/assets/imgs/element_heart.png public/assets/imgs/legacy/element_heart.png
mv public/assets/imgs/element_item.png public/assets/imgs/legacy/element_item.png
mv public/assets/imgs/element_bomb.png public/assets/imgs/legacy/element_bomb.png
mv public/assets/imgs/爱心.png public/assets/imgs/element-heart.png
mv public/assets/imgs/道具.png public/assets/imgs/element-item.png
mv public/assets/imgs/炸弹.png public/assets/imgs/element-bomb.png
```

其余文件严格按设计规格表移动到规范名称，不使用通配符，不覆盖已存在文件。

- [ ] **Step 4: 创建素材表**

创建 `src/constants/assets.ts`：

```ts
const IMG = '/assets/imgs'

export const ASSETS = {
  background: { game: `${IMG}/game-background.png` },
  characters: {
    yena: {
      normal: `${IMG}/yena-normal.png`,
      throw: `${IMG}/yena-throw.png`,
      fever: `${IMG}/yena-fever.png`,
      angry: `${IMG}/yena-angry.png`,
    },
    player: { default: `${IMG}/player-default.png` },
  },
  elements: {
    heart: `${IMG}/element-heart.png`,
    item: `${IMG}/element-item.png`,
    bomb: `${IMG}/element-bomb.png`,
  },
  ui: {
    titleBanner: `${IMG}/ui-title-banner.png`,
    buttonStart: `${IMG}/ui-button-start.png`,
    iconPlay: `${IMG}/ui-icon-play.png`,
    buttonSkin: `${IMG}/ui-button-skin.png`,
    buttonPause: `${IMG}/ui-button-pause.png`,
    modalBackground: `${IMG}/ui-modal-background.png`,
    buttonResume: `${IMG}/ui-button-resume.png`,
    buttonQuit: `${IMG}/ui-button-quit.png`,
    buttonRetry: `${IMG}/ui-button-retry.png`,
    buttonShare: `${IMG}/ui-button-share.png`,
    starOn: `${IMG}/ui-star-on.png`,
    starOff: `${IMG}/ui-star-off.png`,
    feverFull: `${IMG}/ui-fever-full.png`,
    feverEmpty: `${IMG}/ui-fever-empty.png`,
  },
  effects: {
    stunStar: `${IMG}/effect-stun-star.png`,
    particleHeart: `${IMG}/particle-heart.png`,
    particleStar: `${IMG}/particle-star.png`,
    particleSmoke: `${IMG}/particle-smoke.png`,
    particleSparkle: `${IMG}/particle-sparkle.png`,
  },
} as const
```

- [ ] **Step 5: 验证 GREEN**

Run: `npm run verify:assets && npm run build`

Expected: `verified 28 image assets`，随后生产构建成功。

### Task 2: 通用图片按钮、主页、游戏角色与 HUD

**Files:**

- Create: `src/components/ImageButton.tsx`
- Create: `src/components/ImageButton.less`
- Modify: `src/pages/HomePage/index.tsx`
- Modify: `src/pages/HomePage/index.less`
- Modify: `src/pages/GamePage/index.tsx`
- Modify: `src/pages/GamePage/index.less`
- Modify: `src/pages/GamePage/YenaStage.tsx`
- Modify: `src/pages/GamePage/CoreStage.tsx`
- Modify: `src/pages/GamePage/PlayerSprite.tsx`
- Modify: `src/pages/GamePage/PlayerArea.tsx`
- Modify: `src/pages/GamePage/PlayerArea.less`
- Modify: `src/components/HUD/FeverGauge.tsx`
- Modify: `src/components/HUD/HUD.less`

**Interfaces:**

- Consumes: `ASSETS`。
- Produces: `ImageButton({ src, label, className, ...buttonProps })` 和已图片化的主页/游戏/HUD。

- [ ] **Step 1: 记录 RED 页面契约**

在当前页面读取所有 `<img src>`；主页应尚未包含 `/ui-title-banner.png`，游戏 HUD 应尚未包含 `/ui-fever-empty.png`。

- [ ] **Step 2: 创建通用图片按钮**

```tsx
import type { ButtonHTMLAttributes } from 'react'
import './ImageButton.less'

interface ImageButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  src: string
  label: string
}

export function ImageButton({ src, label, className = '', ...props }: ImageButtonProps) {
  return (
    <button type="button" className={`image-button ${className}`} aria-label={label} {...props}>
      <img src={src} alt="" draggable={false} />
    </button>
  )
}
```

CSS 清除默认边框/背景，图片 `width/height:100%`、`object-fit:contain`，`:focus-visible` 使用 4px 高对比 outline，`:active` 缩放到 `0.96`。

- [ ] **Step 3: 接入主页素材**

`HomePage` 使用 `ASSETS.background.game` 内联背景，Banner 图片、皮肤图片按钮、宽版开始按钮与播放徽章。保留统计文字、皮肤标签和 `handleStart`。

- [ ] **Step 4: 接入游戏与 HUD 素材**

- `GamePage` 背景路径改为 `ASSETS.background.game`。
- `YenaStage` 同时读取 `gameState/subState`，映射 normal/throw/fever/angry。
- `CoreStage` 从 `ASSETS.elements` 取图，动态创建的 `<img>` 设置 `draggable=false`。
- `PlayerSprite` 使用 `ASSETS.characters.player.default`。
- `PlayerArea` 的暂停按钮改为 `ImageButton` + `ASSETS.ui.buttonPause`。
- `FeverGauge` 的每格改为 `<img src={filled ? full : empty}>`。

- [ ] **Step 5: 运行构建并验证 GREEN**

Run: `npm run verify:assets && npm run build`

浏览器验证主页和游戏中所有图片 `naturalWidth > 0`；新版元素无白色方块，Fever 槽显示 8 个图片格。

### Task 3: 弹窗、星级和分享

**Files:**

- Modify: `src/components/ModalLayer/PauseModal.tsx`
- Modify: `src/components/ModalLayer/PauseModal.less`
- Modify: `src/components/ModalLayer/ResultModal.tsx`
- Modify: `src/components/ModalLayer/ResultModal.less`

**Interfaces:**

- Consumes: `ImageButton`、`ASSETS.ui`、Redux 结算数据。
- Produces: 图片化暂停/结算弹窗和 `handleShare(): Promise<void>`。

- [ ] **Step 1: 记录 RED 弹窗契约**

暂停弹窗当前不包含 `ui-modal-background.png`、`ui-button-resume.png` 或 `ui-button-quit.png`。

- [ ] **Step 2: 接入暂停弹窗**

弹窗内增加背景 `<img className="modal-panel-background">`，继续和退出改为 `ImageButton`；标题和点击动作保持不变。

- [ ] **Step 3: 接入结算弹窗和分享**

- 星级字符替换为五个 `ASSETS.ui.starOn/starOff` 图片。
- retry/share 使用图片按钮。
- 实现 `navigator.share`，不可用或非取消失败时回退 `navigator.clipboard.writeText`。
- 用户取消分享时静默返回。
- 复制成功显示 1.5 秒“成绩已复制”；复制也失败时显示“分享失败，请稍后重试”。
- 返回主界面保留为文字按钮。

- [ ] **Step 4: 构建并验证 GREEN**

Run: `npm run build`

浏览器验证暂停弹窗图片加载；通过短时测试状态进入结算页，验证星级、retry/share 和返回主页均可操作。

### Task 4: 粒子数据流与图片特效

**Files:**

- Modify: `src/hooks/useGameLoop.ts`
- Modify: `src/pages/GamePage/index.tsx`
- Modify: `src/pages/GamePage/CoreStage.tsx`
- Modify: `src/pages/GamePage/CoreStage.less`
- Modify: `src/pages/GamePage/PlayerSprite.tsx`
- Modify: `src/pages/GamePage/PlayerSprite.less`
- Modify: `src/components/FxLayer/index.tsx`
- Modify: `src/components/FxLayer/index.less`

**Interfaces:**

- Consumes: `useParticles()` 的 `particlesRef/spawnParticles/updateParticles`。
- Produces: `useGameLoop()` 返回同一实例的 `particlesRef/updateParticles`，`CoreStage` 渲染图片粒子。

- [ ] **Step 1: 记录 RED 粒子行为**

游戏碰撞后，`useGameLoop` 的粒子被写入独立 ref；`CoreStage` 收到另一个 ref，因此页面没有可见图片粒子。

- [ ] **Step 2: 统一粒子实例**

在 `useGameLoop` 中：

```ts
const { particlesRef, spawnParticles, updateParticles } = useParticles()
// ...
return {
  startLoop, stopLoop, resetElapsedTime, resetAllTimers,
  isRunningRef, playerXRef, elementsRef, elapsedTimeRef,
  particlesRef, updateParticles,
}
```

`GamePage` 删除自己的 `useParticles()`，直接使用 `useGameLoop()` 返回值。

- [ ] **Step 3: 接入碰撞粒子和眩晕星星**

- `CoreStage` 按 `Particle.shape` 映射 `particleHeart/particleStar/particleSmoke`，设置 `backgroundImage` 和 `backgroundSize: contain`，不再用纯色背景覆盖。
- `PlayerSprite` 的 `.stun-star` 改为 `<img src={ASSETS.effects.stunStar}>`，旋转规则保持。

- [ ] **Step 4: 接入 Fever 金光**

`FxLayer` 在 Fever 时渲染 12 个 `particle-sparkle` 图片，使用固定的 left、animation-delay、animation-duration，避免随机 React 重渲染和 Redux 帧更新。

- [ ] **Step 5: 全量验证**

Run:

```bash
npm run verify:assets
npm run build
git diff --check
```

浏览器验证：

1. 主界面、游戏、暂停、结算的图片均加载成功。
2. 新版三种元素透明。
3. 爱心/道具/炸弹碰撞出现对应图片粒子。
4. Fever 有金光，眩晕星星在玩家头顶且玩家不跳到左侧。
5. 控制台无资源 404 或运行时错误。
