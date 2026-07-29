import { stat } from 'node:fs/promises'

const names = [
  'game-background.png',
  'yena-normal.png',
  'yena-throw.png',
  'yena-fever.png',
  'yena-angry.png',
  'player-default.png',
  'element-heart.png',
  'element-item.png',
  'element-bomb.png',
  'ui-title-banner.png',
  'ui-button-start.png',
  'ui-icon-play.png',
  'ui-button-skin.png',
  'ui-button-pause.png',
  'ui-modal-background.png',
  'ui-button-resume.png',
  'ui-button-quit.png',
  'ui-button-retry.png',
  'ui-button-share.png',
  'ui-star-on.png',
  'ui-star-off.png',
  'ui-fever-full.png',
  'ui-fever-empty.png',
  'effect-stun-star.png',
  'particle-heart.png',
  'particle-star.png',
  'particle-smoke.png',
  'particle-sparkle.png',
]

const groups = [
  {
    label: 'image',
    root: new URL('../public/assets/imgs/', import.meta.url),
    names,
  },
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
const failures = []

for (const group of groups) {
  for (const name of group.names) {
    try {
      const info = await stat(new URL(name, group.root))
      if (!info.isFile() || info.size === 0) failures.push(`${name}: empty`)
    } catch {
      failures.push(`${name}: missing`)
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`verified ${groups[0].names.length} image and ${groups[1].names.length} audio assets`)
}
