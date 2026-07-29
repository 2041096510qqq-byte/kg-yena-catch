# Audio, Scale, and Bomb Balance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 接入已交付 BGM/SFX，放大鸭子与三种下落元素并同步碰撞框，同时提高四阶段炸弹概率。

**Architecture:** 素材路径继续集中在 `ASSETS`；`useGameAudio` 使用模块级共享 BGM 实例和按事件创建的 SFX 实例，页面只负责生命周期，游戏循环只负责事件触发。尺寸、碰撞框和概率继续由现有常量/阶段配置驱动，并通过源码契约脚本和 Node 测试锁定。

**Tech Stack:** React 18、TypeScript 5、Redux Toolkit、HTMLAudioElement、Web Audio API、Less、Vite 5、Node.js test runner

## Global Constraints

- BGM 文件必须命名为 `bgm-game.m4a`，约 178.77 秒，循环音量 `0.35`。
- SFX 音量必须为 `0.65`；正向得分、炸弹、Fever 分别使用已交付的三个 WAV 文件。
- 点击开始立即播放 BGM；暂停保留进度；继续恢复；结算/首页/卸载时停止并归零。
- 玩家视觉尺寸必须为 150px，碰撞框必须为 80×80px，视觉与碰撞中心同轴。
- 三种元素视觉必须统一为 84px，碰撞框必须统一为 64×64px，渲染位移减去 42px。
- 四阶段 heart/item/bomb 概率必须分别为 57/25/18、48/30/22、39/35/26、35/35/30。
- Fever 期间继续不生成炸弹。
- 游戏保持 180 秒、眩晕保持 2 秒；掉落间隔、速度、得分、Combo 阈值和 Fever 时长不变。
- 当前工作区含既有未提交实现；只编辑任务列出的文件，不创建混合提交。

---

### Task 1: 规范音频文件并扩展素材校验

**Files:**
- Rename: `public/assets/audio/音源.m4a` → `public/assets/audio/bgm-game.m4a`
- Modify: `scripts/verify-assets.mjs`
- Modify: `src/constants/assets.ts`

**Interfaces:**
- Consumes: `public/assets/audio/` 中四个非空音频文件。
- Produces: `ASSETS.audio.bgmGame|scoreBonus|explosion|feverBoost` 与包含音频的 `npm run verify:assets`。

- [ ] **Step 1: 先把音频加入素材契约**

将 `verify-assets.mjs` 拆成图片和音频两组：

```js
const groups = [
  { label: 'image', root: new URL('../public/assets/imgs/', import.meta.url), names: imageNames },
  {
    label: 'audio',
    root: new URL('../public/assets/audio/', import.meta.url),
    names: [
      'bgm-game.m4a',
      'sfx_score_bonus.wav',
      'sfx_explosion.wav',
      'sfx_fever_boost.wav',
    ],
  },
]
```

逐组使用 `stat` 检查文件存在、是普通文件且大小大于零；成功输出：

```text
verified 28 image and 4 audio assets
```

- [ ] **Step 2: 运行素材契约并确认 RED**

Run: `npm run verify:assets`

Expected: FAIL，明确报告 `bgm-game.m4a: missing`。

- [ ] **Step 3: 重命名 BGM 并加入集中映射**

重命名文件后，在 `assets.ts` 增加：

```ts
const AUDIO = '/assets/audio'

audio: {
  bgmGame: `${AUDIO}/bgm-game.m4a`,
  scoreBonus: `${AUDIO}/sfx_score_bonus.wav`,
  explosion: `${AUDIO}/sfx_explosion.wav`,
  feverBoost: `${AUDIO}/sfx_fever_boost.wav`,
},
```

- [ ] **Step 4: 验证素材契约转绿**

Run: `npm run verify:assets`

Expected: `verified 28 image and 4 audio assets`

---

### Task 2: 放大角色元素并调整四阶段概率

**Files:**
- Modify: `scripts/verify-game-layout.mjs`
- Modify: `scripts/verify-game-layout.test.mjs`
- Modify: `src/constants/game.ts`
- Modify: `src/data/levels.ts`
- Modify: `src/pages/GamePage/PlayerSprite.less`
- Modify: `src/pages/GamePage/CoreStage.tsx`
- Modify: `src/pages/GamePage/CoreStage.less`

**Interfaces:**
- Consumes: `PLAYER_VISUAL_SIZE`、`PLAYER_WIDTH/HEIGHT`、`ELEMENT_SIZE` 和 `LEVELS`。
- Produces: 150px 玩家、84px 元素、同步碰撞框以及新四阶段概率。

- [ ] **Step 1: 先把测试夹具改成目标尺寸并加入负例**

在 `verify-game-layout.test.mjs` 的有效夹具中使用：

```ts
export const PLAYER_WIDTH = 80
export const PLAYER_HEIGHT = 80
export const PLAYER_VISUAL_SIZE = 150
export const ELEMENT_SIZE = 64
```

Player CSS 改为 150×150px，并增加 `CoreStage.less` 与 `CoreStage.tsx` 夹具：

```less
.game-element { width: 84px; height: 84px; }
.element-heart img, .element-item img, .element-bomb img { width: 84px; height: 84px; }
```

```ts
node.style.transform = `translate(${el.x * 750 - 42}px, ${el.y * 1334 - 42}px)`
```

新增负例：玩家 CSS 回退到 120px、任一元素为 60px、位移仍减 30px 时对应契约必须失败。

- [ ] **Step 2: 运行布局测试并确认 RED**

Run: `node --test scripts/verify-game-layout.test.mjs`

Expected: FAIL，因为校验器和生产实现仍要求旧尺寸。

- [ ] **Step 3: 更新布局契约与生产尺寸**

布局校验器新增 `CoreStage.tsx`、`CoreStage.less` 输入，并检查：

```text
PLAYER_VISUAL_SIZE = 150
PLAYER_WIDTH = 80
PLAYER_HEIGHT = 80
ELEMENT_SIZE = 64
player CSS = 150×150
game element CSS = 84×84
all element images = 84×84
element transform subtracts 42
```

生产代码对应改为相同数值。`CoreStage.tsx` 创建图片时的 `width/height` 属性也设为 84。

- [ ] **Step 4: 加入概率契约并更新 LEVELS**

布局校验器读取 `src/data/levels.ts`，检查以下四个三元组：

```text
0.57 / 0.25 / 0.18
0.48 / 0.30 / 0.22
0.39 / 0.35 / 0.26
0.35 / 0.35 / 0.30
```

每组总和必须为 1。`levels.ts` 更新成相同数值，生成间隔和速度倍率保持不变。

- [ ] **Step 5: 验证尺寸与概率转绿**

Run: `node --test scripts/verify-game-layout.test.mjs`

Expected: 所有测试通过。

Run: `npm run verify:layout`

Expected: 所有布局与概率契约通过。

---

### Task 3: 实现共享音频生命周期与事件接线

**Files:**
- Create: `scripts/verify-game-audio.mjs`
- Modify: `package.json`
- Modify: `src/hooks/useGameAudio.ts`
- Modify: `src/hooks/useGameLoop.ts`
- Modify: `src/pages/HomePage/index.tsx`
- Modify: `src/pages/GamePage/index.tsx`

**Interfaces:**
- Produces from `useGameAudio()`:

```ts
{
  playBGM: () => Promise<void>
  pauseBGM: () => void
  stopBGM: () => void
  playSFX: (type: SfxType) => void
}
```

- Consumes: `ASSETS.audio` 四条路径和 Redux 的 `GameState` / `SubState`。

- [ ] **Step 1: 写入会失败的音频接线契约**

`verify-game-audio.mjs` 读取音频 hook、首页、游戏页和游戏循环源码，至少检查：

```text
ASSETS.audio.bgmGame
bgm.loop = true
bgm.volume = 0.35
SFX volume = 0.65
heart/item -> scoreBonus
bomb -> explosion
fever -> feverBoost
HomePage handleStart calls playBGM before dispatch(startGame())
GamePage pauses on PAUSED and stops on RESULT/unmount
useGameLoop triggers heart/item/bomb/fever/combo/stun/tick
```

失败时逐条输出 `FAIL: <label>`，成功输出 `verified <N> game audio contracts`。在 `package.json` 增加：

```json
"verify:audio": "node scripts/verify-game-audio.mjs"
```

- [ ] **Step 2: 运行音频契约并确认 RED**

Run: `npm run verify:audio`

Expected: FAIL，因为实际音频生命周期和事件接线尚不存在。

- [ ] **Step 3: 实现共享 BGM 与 SFX**

`useGameAudio.ts` 使用模块级 `bgmAudio` 与 `audioContext`，并返回稳定 callback：

```ts
export type SfxType = 'heart' | 'item' | 'bomb' | 'fever' | 'combo' | 'stun' | 'tick'

const FILE_SFX: Partial<Record<SfxType, string>> = {
  heart: ASSETS.audio.scoreBonus,
  item: ASSETS.audio.scoreBonus,
  bomb: ASSETS.audio.explosion,
  fever: ASSETS.audio.feverBoost,
}
```

`playBGM` 创建或复用单例，设置 `loop=true`、`volume=0.35` 并捕获 `play()` 拒绝。`pauseBGM` 只暂停；`stopBGM` 暂停并归零。文件 SFX 每次创建新 Audio、音量 0.65；创建或播放失败时调用原有合成音回退。

- [ ] **Step 4: 接入页面状态**

`HomePage.handleStart` 顺序固定为：

```ts
void playBGM()
dispatch(startGame())
```

`GamePage` 状态效果：

```ts
COUNTDOWN -> reset timers + playBGM
PLAYING -> startLoop + playBGM
PAUSED -> stopLoop + pauseBGM
RESULT/other -> stopLoop + stopBGM
unmount -> stopBGM
```

- [ ] **Step 5: 接入游戏事件**

`useGameLoop` 调用：

```text
heart collision -> playSFX('heart')
item collision -> playSFX('item')
bomb collision -> playSFX('bomb') + playSFX('stun')
Fever transition -> playSFX('fever')
new Combo title -> playSFX('combo')
remaining 1–10 seconds -> playSFX('tick') once per second
```

礼盒触发 Fever 时得分音和 Fever 音允许重叠。无敌期间无效炸弹不播放音效。

- [ ] **Step 6: 验证音频契约转绿并构建**

Run: `npm run verify:audio`

Expected: 所有音频契约通过。

Run: `npm run build`

Expected: TypeScript 与 Vite 构建成功。

---

### Task 4: 全量回归与浏览器验收

**Files:**
- No production changes expected.

**Interfaces:**
- Consumes: Tasks 1–3 的完整实现。
- Produces: 自动验证与浏览器验收证据。

- [ ] **Step 1: 运行全部自动验证**

Run:

```text
node --test scripts/verify-game-layout.test.mjs
npm run verify:assets
npm run verify:layout
npm run verify:audio
npm run build
git diff --check
```

Expected: 全部退出 0，无 warning/error。

- [ ] **Step 2: 浏览器验证尺寸和概率**

在 `http://localhost:5173/` 开始游戏：

- 玩家实际宽度约为上一版的 1.25 倍。
- 三种元素实际宽度为上一版的 1.4 倍，中心与运动轨迹对齐。
- 采集至少 30 次生成类型；非 Fever 样本中炸弹占比能观察到明显高于旧第一阶段 10%，并与 18% 目标方向一致。
- 页面无破图、缺失音频请求或控制台错误。

- [ ] **Step 3: 浏览器验证音频生命周期**

使用媒体元素状态与事件监听验证：

- 点击开始后 BGM `paused=false`。
- 暂停后 `paused=true` 且 `currentTime` 保留。
- 继续后 `paused=false` 且从保留进度继续。
- 接住正向元素、炸弹和触发 Fever 时创建对应音频请求。
- 结算或返回首页后 BGM 暂停且 `currentTime=0`。

- [ ] **Step 4: 确认玩法常量未漂移**

检查：

```text
GAME_DURATION = 180
STUN_DURATION = 2000
FEVER_DURATION = 10000
spawnInterval = 1.2 / 1.0 / 0.85 / 0.7
SPEED_MULTIPLIERS = 1.0 / 1.1 / 1.2 / 1.3
```

