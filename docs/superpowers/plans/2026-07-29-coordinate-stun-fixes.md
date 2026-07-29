# 元素生成位置与眩晕定位修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让下落元素从 Yena 手部附近出现，并让玩家在原位置完成 2 秒眩晕动画。

**Architecture:** 继续使用现有 750×1334 整屏归一化坐标，不引入第二套局部坐标。玩家外层节点只承担位置变换，眩晕抖动下沉到图片子节点，从结构上消除两个 `transform` 写入方的冲突。

**Tech Stack:** React 18、TypeScript 5、Less、Vite 5、浏览器行为验证

## Global Constraints

- `STUN_DURATION` 保持 `2000ms`。
- `INVINCIBLE_DURATION` 保持 `1500ms`。
- 不调整掉落速度、碰撞区域、得分、Combo 或 Fever 逻辑。
- 保留当前未提交素材和页面改动，不覆盖无关文件。

---

## 文件结构

- `src/constants/game.ts`：维护元素生成位置和横向随机范围。
- `src/pages/GamePage/CoreStage.less`：让元素渲染容器覆盖整屏坐标空间。
- `src/pages/GamePage/PlayerSprite.less`：让外层负责定位、图片负责眩晕抖动。

### Task 1: 整屏元素坐标

**Files:**

- Modify: `src/constants/game.ts:42-50`
- Modify: `src/pages/GamePage/CoreStage.less:1-8`
- Test: 本地浏览器中的 `.core-stage` 与首个 `.game-element` 实际边界

**Interfaces:**

- Consumes: `GameElement.x/y`，均为相对 750×1334 整屏画布的 `0..1` 归一化坐标。
- Produces: `ELEMENT_SPAWN_Y = 0.25`、`YENA_HAND_X_VARIANCE = 0.15`，以及不叠加纵向偏移的 `.core-stage`。

- [ ] **Step 1: 启动页面并记录元素坐标的失败行为**

```bash
npm run dev -- --host 127.0.0.1
```

开始一局并等待第一个元素出现，在浏览器中读取真实布局：

```js
const stage = document.querySelector('.game-stage').getBoundingClientRect()
const core = document.querySelector('.core-stage').getBoundingClientRect()
const element = document.querySelector('.game-element').getBoundingClientRect()
({
  coreTopInDesignPx: (core.top - stage.top) / (stage.width / 750),
  elementCenterYInDesignPx:
    (element.top + element.height / 2 - stage.top) / (stage.width / 750),
})
```

Expected RED: `coreTopInDesignPx` 约为 `333.5`，首个元素中心约为 `733.7`，证明 `25% + 30%` 的重复偏移确实存在。

- [ ] **Step 2: 实现最小坐标修复**

将 `src/constants/game.ts` 的相关常量改为：

```ts
export const YENA_HAND_X = 0.5
export const YENA_HAND_X_VARIANCE = 0.15
export const ELEMENT_SPAWN_Y = 0.25
```

将 `.core-stage` 改为：

```less
.core-stage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}
```

- [ ] **Step 3: 确认真实元素坐标变绿**

刷新并开始新一局，重复 Step 1 的浏览器测量。

Expected GREEN:

- `coreTopInDesignPx` 为 `0`。
- 首个元素中心约为 `333.5`，即设计画布的 `25%`。
- 连续观察多个元素，其中心 x 位于设计画布 `262.5..487.5`，即 `35%..65%`。

- [ ] **Step 4: 提交元素坐标修复**

```bash
git add src/constants/game.ts src/pages/GamePage/CoreStage.less
git commit -m "fix: align element rendering with screen coordinates"
```

### Task 2: 原地眩晕动画

**Files:**

- Modify: `src/pages/GamePage/PlayerSprite.less:1-33`
- Test: 本地浏览器中的 `.player-sprite` 实际变换矩阵

**Interfaces:**

- Consumes: `PlayerSprite.tsx` 每帧写入 `.player-sprite` 的 `transform: translateX(...)`，以及其内部 `.player-img`。
- Produces: `.player-sprite.stunned .player-img` 抖动；外层 `.player-sprite` 的定位 `transform` 始终不被 CSS 动画覆盖。

- [ ] **Step 1: 记录眩晕定位的失败行为**

在运行中的页面将玩家外层放到非零横向位置，再施加现有眩晕类：

```js
const sprite = document.querySelector('.player-sprite')
sprite.style.transform = 'translateX(500px)'
sprite.classList.add('stunned')
await new Promise(resolve => setTimeout(resolve, 150))
({
  inlineTransform: sprite.style.transform,
  computedTransform: getComputedStyle(sprite).transform,
})
```

Expected RED: `inlineTransform` 仍为 `translateX(500px)`，但 `computedTransform` 的 x 位移接近 `0..10px`，证明动画覆盖了角色位置。

- [ ] **Step 2: 将抖动动画移动到图片节点**

把外层规则改为：

```less
.player-sprite {
  width: 80px;
  height: 80px;
  position: absolute;
  bottom: 80px;
}

.player-sprite.stunned .player-img {
  animation: shake 0.5s ease-in-out infinite;
}
```

保持现有 `@keyframes shake` 的 `±10px` 局部位移和 `.stun-star` 旋转动画不变。

- [ ] **Step 3: 确认眩晕定位行为变绿**

刷新页面，重复 Step 1 的浏览器操作，并同时读取图片变换：

```js
({
  spriteTransform: getComputedStyle(sprite).transform,
  imageTransform: getComputedStyle(sprite.querySelector('.player-img')).transform,
})
```

Expected GREEN:

- `spriteTransform` 的 x 位移保持 `500px`。
- `imageTransform` 的 x 位移在 `-10..10px` 间变化。

- [ ] **Step 4: 运行完整生产构建**

Run: `npm run build`

Expected: TypeScript 与 Vite 构建成功，无编译错误。

- [ ] **Step 5: 在浏览器验证完整交互**

Run: `npm run dev -- --host 127.0.0.1`

验证：

1. 开始游戏后，元素中心从约 `25%` 屏高的 Yena 手部附近出现。
2. 元素横向生成范围集中于画面中心 `35%..65%`。
3. 将玩家移动到画面右侧并触发炸弹后，玩家在该位置附近抖动 2 秒，不跳到最左侧。
4. 眩晕期间输入不改变玩家位置，结束后可继续移动。

- [ ] **Step 6: 提交眩晕修复**

```bash
git add src/pages/GamePage/PlayerSprite.less
git commit -m "fix: keep player position during stun"
```
