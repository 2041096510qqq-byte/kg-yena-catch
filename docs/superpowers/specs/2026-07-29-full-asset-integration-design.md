# 全量图片素材接入设计

## 目标

将 `public/assets/imgs/` 中已交付的角色、游戏元素、UI、弹窗、星级、Fever 和粒子素材接入现有游戏，替换仍在使用的 CSS/文字占位视觉。所有运行时代码通过一个集中素材表引用语义化路径，避免误用已淘汰的白底下落元素。

本次只接入图片。音频、缺失的玩家皮肤 2/3 和新的玩法功能不在范围内。

## 素材命名

运行时素材统一使用英文 kebab-case 文件名。

### 已有英文素材

| 当前文件 | 规范文件 |
|---|---|
| `bg_game.png` | `game-background.png` |
| `yena_normal.png` | `yena-normal.png` |
| `yena_throw.png` | `yena-throw.png` |
| `yena_fever.png` | `yena-fever.png` |
| `yena_angry.png` | `yena-angry.png` |
| `player_default.png` | `player-default.png` |

### 新版透明下落元素

新版中文文件作为正式运行时素材：

| 当前文件 | 规范文件 |
|---|---|
| `爱心.png` | `element-heart.png` |
| `道具.png` | `element-item.png` |
| `炸弹.png` | `element-bomb.png` |

旧的 `element_heart.png`、`element_item.png`、`element_bomb.png` 不再被代码引用，移动到 `public/assets/imgs/legacy/` 保存，不删除。

### UI 与特效

| 当前文件 | 规范文件 |
|---|---|
| `标题 Banner.png` | `ui-title-banner.png` |
| `按钮-开始游戏.png` | `ui-button-start.png` |
| `开始按钮.png` | `ui-icon-play.png` |
| `按钮-皮肤选择.png` | `ui-button-skin.png` |
| `暂停按钮.png` | `ui-button-pause.png` |
| `弹窗背景.png` | `ui-modal-background.png` |
| `按钮-继续游戏.png` | `ui-button-resume.png` |
| `按钮-退出本局.png` | `ui-button-quit.png` |
| `按钮-再来一局.png` | `ui-button-retry.png` |
| `按钮-分享成绩.png` | `ui-button-share.png` |
| `星级-亮.png` | `ui-star-on.png` |
| `星级-暗.png` | `ui-star-off.png` |
| `Fever 槽满格图标 .png` | `ui-fever-full.png` |
| `Fever 槽空格图标 .png` | `ui-fever-empty.png` |
| `眩晕星星.png` | `effect-stun-star.png` |
| `粒子-爱心粉.png` | `particle-heart.png` |
| `粒子-星星金.png` | `particle-star.png` |
| `粒子-烟雾灰.png` | `particle-smoke.png` |
| `粒子-金光.png` | `particle-sparkle.png` |

`.DS_Store` 和 `.gitkeep` 不属于运行时素材，不进入素材表。

## 素材访问层

新增 `src/constants/assets.ts`，导出只读的 `ASSETS` 对象。组件不再散落硬编码 `/assets/imgs/...` 字符串。

素材表按职责分组：

- `background.game`
- `characters.yena.normal/throw/fever/angry`
- `characters.player.default`
- `elements.heart/item/bomb`
- `ui.titleBanner/buttonStart/iconPlay/buttonSkin/buttonPause/modalBackground/buttonResume/buttonQuit/buttonRetry/buttonShare/starOn/starOff/feverFull/feverEmpty`
- `effects.stunStar/particleHeart/particleStar/particleSmoke/particleSparkle`

文件名重命名与代码引用在同一个实现批次完成，避免中间状态产生 404。

## 组件设计

### 主界面

- `HomePage` 使用游戏背景图作为全屏背景，并保留轻量遮罩确保统计数字可读。
- 标题文字替换为 `ui-title-banner.png`。
- 皮肤入口使用 `ui-button-skin.png`；当前皮肤名称作为可见小标签保留。
- 开始按钮使用 `ui-button-start.png`，`ui-icon-play.png` 作为左侧重叠的圆形播放徽章。
- 图片按钮保留原生 `<button>`，设置 `aria-label`；图片本身使用空 `alt`，避免屏幕阅读器重复播报。

### 游戏角色和元素

- `YenaStage` 在倒计时/暂停时显示 normal，普通游戏时显示 throw，Fever 时显示 fever，眩晕时显示 angry。
- `PlayerSprite` 使用 `player-default.png`。
- `CoreStage` 的三种下落物使用新版透明的 `element-heart/item/bomb.png`。
- 所有角色和元素图片设置 `draggable={false}` 或对应 DOM 属性，防止桌面拖拽干扰输入。

### HUD

- Fever 槽仍保留 8 格语义，每格根据状态渲染 `ui-fever-full.png` 或 `ui-fever-empty.png`。
- 计时、分数、Combo 和 Fever 次数继续使用实时文字，避免把动态数据做成图片。

### 暂停与结算弹窗

- `.modal-panel` 使用 `ui-modal-background.png` 作为背景层，内容在其上方排版。
- 暂停弹窗使用 resume/quit 图片按钮。
- 结算弹窗使用五个亮暗星级图片、retry/share 图片按钮。
- 返回主界面保留为弹窗底部文字入口，避免缺少对应图片导致用户无法退出。
- 分享按钮调用 Web Share API；不可用或失败时复制“总分/最高 Combo/Fever 次数”文本，并显示短暂的“成绩已复制”反馈。用户取消系统分享不显示错误。

### 粒子和眩晕

- 修复当前 `useGameLoop` 和 `GamePage` 各自创建 `useParticles()` 实例的问题。粒子生成、更新和渲染共享同一个 `particlesRef`。
- `Particle.shape` 映射为图片：`circle → particle-heart`、`star → particle-star`、`smoke → particle-smoke`。
- Fever 状态在 `FxLayer` 中渲染固定数量的 `particle-sparkle` 图片，通过 CSS 延迟和横向位置形成飘落效果，不增加每帧 Redux 更新。
- 玩家头顶的 CSS 多边形星星替换为 `effect-stun-star.png`，保留旋转动画。

## 视觉与交互约束

- 不改变 750×1334 设计坐标和现有响应式缩放方式。
- 不改变元素生成位置、碰撞框、掉落速度、2 秒眩晕、Combo、Fever 或得分规则。
- 图片按钮点击区域至少覆盖图片可见区域，并保留现有 disabled/hover/active 反馈。
- 图片使用 `object-fit: contain`，不拉伸变形。
- 旧 CSS 占位背景只在对应图片已接入时移除；动画类名与状态机保持不变。

## 错误处理

- 所有路径集中于 `ASSETS`，浏览器验证时逐一检查 `naturalWidth > 0`。
- 分享失败仅显示本地反馈，不中断结算页。
- 缺失的皮肤素材不创建虚假的皮肤入口；当前默认皮肤行为保持不变。

## 验证

1. 生产构建通过，无 TypeScript 或 Less 编译错误。
2. 浏览器依次验证主界面、倒计时、游戏中、暂停、眩晕、Fever 和结算状态。
3. 页面中所有运行时 `<img>` 均加载成功，`naturalWidth > 0`，控制台无图片 404。
4. 新版爱心、道具和炸弹显示透明背景，不出现白色方块。
5. 粒子在三种碰撞后可见，Fever 金光持续显示，眩晕星星位于玩家头顶。
6. 图片按钮可点击，键盘焦点可见；分享不可用时复制回退正常。

## 非目标

- 不生成或修改现有 PNG 内容。
- 不接入音频。
- 不新增未交付的皮肤。
- 不删除旧白底下落元素，只移动到 `legacy/`。
