# kg_yena_catch 游戏设计说明书

> 阶段: Design Spec v2.0
> 日期: 2026-07-29
> 状态: 已确认
> 基于: 需求-最终PRD.md v1.0 / 策划-玩法概念文档.md v1.0 + 设计决策确认

---

## 一、游戏概述

**kg_yena_catch** 是一款 Yena 主题的竖版粉丝接礼物游戏。

- **游戏时长**: 180 秒（3分钟整）
- **核心循环**: Yena 从顶部立绘区不断丢出三种下落物，玩家在底部拖动粉丝小人左右移动来接住/躲避
- **目标**: 在 180 秒内尽可能获得更高分数

---

## 二、游戏元素

### 2.1 三种下落物

| 元素 | 图标 | 得分 | 效果 |
|------|------|------|------|
| 爱心 | 粉色圆形 | +1 分 | Combo +1 |
| 道具/礼盒 | 金色方形 | +5 分 | Combo +1，Fever 槽 +1 |
| 炸弹 | 黑色圆形+红边 | -2 分 | 强制眩晕 5 秒，Combo 清零 |

### 2.2 Combo 系统（5级）

| 等级 | 称号 | 触发条件（连击数） | 额外加分 |
|------|------|-------------------|---------|
| 1 | Nice! | ≥ 3 连击 | +2 |
| 2 | Great! | ≥ 7 连击 | +5 |
| 3 | Amazing! | ≥ 15 连击 | +10 |
| 4 | Catch Catch! | ≥ 25 连击 | +20 |
| 5 | Unreal! | ≥ 40 连击 | +30 |

> Combo = 连续接住非炸弹元素。接炸弹 → Combo 清零。
> 称号触发时弹出动画，不重复触发同级称号直到达到更高等级。

### 2.3 Fever Time

| 参数 | 值 |
|------|---|
| 触发条件 | Fever 槽累计 8 格满 |
| 持续时间 | 10 秒 |
| 效果 | 双倍得分 + 无炸弹掉落 |
| Fever 槽清空 | 进入 Fever 时 |

### 2.4 眩晕系统

| 参数 | 值 |
|------|---|
| 触发 | 接到炸弹 |
| 持续时间 | 5 秒 |
| 效果 | 玩家操作全部失效 |
| 无敌窗口 | 眩晕结束后 1.5 秒内无敌（不触发新眩晕） |

---

## 三、游戏数值

### 3.1 掉落参数（四阶段，每45秒切换）

| 阶段 | 时间范围 | 生成间隔(s) | 爱心% | 道具% | 炸弹% | 速度倍率 |
|------|---------|-----------|-------|-------|-------|---------|
| Q1 | 0-45s | 1.2 | 65% | 25% | 10% | 1.0× |
| Q2 | 45-90s | 1.0 | 55% | 30% | 15% | 1.1× |
| Q3 | 90-135s | 0.85 | 45% | 35% | 20% | 1.2× |
| Q4 | 135-180s | 0.7 | 40% | 35% | 25% | 1.3× |

> 生成位置：Yena 手部 x 位置 ±15% 随机偏移
> 速度基准：元素从 Yena 手部落到玩家区域约 2-3 秒（Q4 最快约 1.5-2s）

### 3.2 结算星级（目标分 100）

| 星级 | 最低得分 | 得分率 |
|------|---------|--------|
| ⭐ | 30 | 30% |
| ⭐⭐ | 60 | 60% |
| ⭐⭐⭐ | 100 | 100% |
| ⭐⭐⭐⭐ | 130 | 130% |
| ⭐⭐⭐⭐⭐ | 160 | 160% |

---

## 四、页面结构

### 4.1 页面列表

| 页面 | 代码标识 | 游戏状态 | 职责 |
|------|---------|---------|------|
| 主界面 | HomePage | IDLE | 皮肤入口 + 开始按钮 |
| 游戏界面 | GamePage | PLAYING/PAUSED/COUNTDOWN | 核心游玩 |
| 倒计时浮层 | CountdownOverlay | COUNTDOWN | 3-2-1 大字 |
| 结算弹窗 | ResultModal | RESULT | 星级评价 + 统计 + 再来一局 |
| 暂停弹窗 | PauseModal | PAUSED | 继续 / 退出 |

### 4.2 游戏界面布局

```
┌──────────────────────────────────┐ 750×1334
│  HUD                    ~8%    │ 倒计时/分数/Combo/Fever槽
│  ⏱️01:23    🔥12 Combo   ████   │
├──────────────────────────────────┤
│                                 │
│  YenaStage              ~25%   │
│  ┌──────────────────────────┐  │
│  │    Yena 立绘（半身像）    │  │ ← 手部 = 元素生成原点
│  └──────────────────────────┘  │
│                                 │
│  CoreStage（游戏舞台）  ~50%    │ ← 元素下落区域
│  ┌──────────────────────────┐  │
│  │    💖   🎁   💣         │  │
│  │     ↓    ↓    ↓         │  │
│  └──────────────────────────┘  │
│                                 │
├──────────────────────────────────┤
│  PlayerArea             ~12%   │
│  ┌──────────────────────────┐  │
│  │      🏃 粉丝小人           │  │ ← x 轴跟随手指
│  └──────────────────────────┘  │
│  [⏸️]                          │ ← 暂停按钮
└──────────────────────────────────┘
全局浮层 z:100: FxLayer（浮动分数/Combo称号/Fever大字/眩晕特效）
全局弹窗 z:200: ModalLayer（ResultModal/PauseModal）
```

### 4.3 组件层级

```
App.tsx（状态机）
├── HomePage
│   ├── TitleBanner
│   ├── SkinButton
│   └── StartButton
│
├── GamePage
│   ├── HUD
│   │   ├── TimerDisplay
│   │   ├── ScoreDisplay
│   │   ├── ComboDisplay
│   │   └── FeverGauge
│   ├── YenaStage
│   ├── CoreStage
│   │   ├── ElementNode × N（ref驱动）
│   │   └── ParticleNode × M（ref驱动）
│   └── PlayerArea
│       ├── PlayerSprite（ref驱动）
│       └── PauseButton
│
├── CountdownOverlay
│
├── ModalLayer
│   ├── ResultModal
│   └── PauseModal
│
└── FxLayer
    ├── FloatScoreText × N
    ├── ComboTitlePopup
    ├── FeverOverlay
    └── StunOverlay
```

---

## 五、游戏状态机

```
IDLE ──[开始]──→ COUNTDOWN(3-2-1) ──[倒计时结束]──→ PLAYING
                                                            │
                                          ┌─────────────────┤
                                          ↓                 ↓
                                     [暂停按钮]         [时间到/主动结束]
                                          ↓                 ↓
                                       PAUSED ──[继续]──→ PLAYING
                                                          └─[结束]──→ RESULT
RESULT ──[再来一局]──→ COUNTDOWN
RESULT ──[退出]──→ IDLE
```

---

## 六、技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 18.x |
| 渲染 | DOM + CSS（无渲染引擎） |
| 语言 | TypeScript 5.x |
| 样式 | Less + postcss-pxtorem |
| 状态管理 | Redux (@reduxjs/toolkit) |
| 构建 | Vite 5.x |
| 音频 | Web Audio API + HTMLAudioElement |

> 判定：maxConcurrentEntities ≈ 39，GPU transform 加速，无物理引擎 → DOM + CSS 方案

---

## 七、帧级架构

### 7.1 运行时分层

| 层级 | 更新频率 | 工具 | 说明 |
|------|---------|------|------|
| 游戏逻辑帧 | 60fps (rAF) | useRef + 直接 DOM 操作 | 元素移动/碰撞检测/粒子更新 |
| UI 渲染帧 | React 渲染 | Redux + React 组件 | HUD/弹窗/浮层 |
| 音频帧 | 事件触发 | Web Audio API | 音效播放 |

### 7.2 Tick 阶段序（每帧）

1. 读取触摸输入 → 更新 targetPlayerX
2. 生成判断 → 满足条件则创建新元素
3. 移动更新 → 推进所有元素 y += speed × Δt
4. 碰撞检测 → 命中则触发结算
5. 结算处理 → dispatch Redux（分数/Combo/Fever/眩晕）
6. 计时更新 → 每秒更新倒计时/Fever/眩晕
7. DOM 渲染 → 直接操作 DOM ref 更新 transform

> ⚠️ 每帧不 dispatch Redux，只有碰撞事件/每秒计时/状态变化时才 dispatch

---

## 八、开发阶段占位符方案

| 类别 | 占位方案 |
|------|---------|
| Yena 立绘 | 灰色矩形 div + 文字 |
| 小人 | 60×60px 圆角 div，CSS 背景色区分皮肤 |
| 爱心 | 粉色圆形 div |
| 道具 | 金色方形 div |
| 炸弹 | 黑色圆形 + 红色边框 div |
| 粒子 | CSS @keyframes + box-shadow，无图片 |
| 按钮 | CSS + 文字 |
| 弹窗背景 | CSS 半透明 + 圆角 |
| 星级 | Unicode ★☆ |
| BGM/SFX | Web Audio 合成音或留空 |

---

## 九、文件结构

```
kg_yena_catch/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── assets/
│       ├── imgs/          # 素材（占位符阶段留空）
│       └── audio/         # 音频（占位符阶段留空）
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── apis/
│   │   ├── index.ts
│   │   └── mocks/
│   │       └── index.ts
│   ├── components/
│   │   ├── ModalLayer/
│   │   └── FxLayer/
│   ├── constants/
│   │   ├── index.ts
│   │   ├── enum.ts
│   │   └── game.ts        # 游戏数值常量
│   ├── data/
│   │   └── levels.ts      # 四阶段掉落参数表
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
│   │   └── GamePage/
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

## 十、素材清单（待提供）

详见 `prd/素材清单-规格要求.md`

---

## 十一、后续步骤

1. ~~需求确认~~ ✅
2. ~~设计确认~~ ✅
3. 制定实现计划
4. 搭建项目骨架
5. 实现游戏核心循环
6. 实现 UI 和交互
7. 接入素材（如有）
