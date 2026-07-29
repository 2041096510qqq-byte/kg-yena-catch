import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const verifier = path.join(path.dirname(fileURLToPath(import.meta.url)), 'verify-game-layout.mjs')

const validSources = {
  'src/constants/game.ts': `
    export const GAME_WIDTH = 750
    export const GAME_HEIGHT = 1334
    export const PLAYER_WIDTH = 80
    export const PLAYER_HEIGHT = 80
    export const PLAYER_VISUAL_SIZE = 150
    export const ELEMENT_SIZE = 64
    export const PARTICLE_SIZE_SCALE = 2.2
    export const ELEMENT_SPAWN_MIN_X = 0.08
    export const ELEMENT_SPAWN_MAX_X = 0.92
  `,
  'src/hooks/useGameElements.ts': `
    const x = ELEMENT_SPAWN_MIN_X + Math.random() * (ELEMENT_SPAWN_MAX_X - ELEMENT_SPAWN_MIN_X)
  `,
  'src/hooks/useParticles.ts': 'const particle = { size: cfg.size * PARTICLE_SIZE_SCALE }',
  'src/hooks/useCollision.ts': `
    import { ELEMENT_SIZE, GAME_HEIGHT, GAME_WIDTH, PLAYER_HEIGHT, PLAYER_MAX_X, PLAYER_MIN_X, PLAYER_WIDTH } from '../constants/game'
    const PLAYER_WIDTH_NORM = PLAYER_WIDTH / GAME_WIDTH
    const PLAYER_HEIGHT_NORM = PLAYER_HEIGHT / GAME_HEIGHT
    const ELEMENT_WIDTH_NORM = ELEMENT_SIZE / GAME_WIDTH
    const ELEMENT_HEIGHT_NORM = ELEMENT_SIZE / GAME_HEIGHT
    const PLAYER_Y_NORM = 0.88
    const eLeft = elementXNorm - ELEMENT_WIDTH_NORM / 2
    const eRight = elementXNorm + ELEMENT_WIDTH_NORM / 2
    const eTop = elementYNorm - ELEMENT_HEIGHT_NORM / 2
    const eBottom = elementYNorm + ELEMENT_HEIGHT_NORM / 2
  `,
  'src/pages/GamePage/PlayerSprite.tsx': 'const x = xRef.current * 750 - PLAYER_VISUAL_SIZE / 2',
  'src/pages/GamePage/PlayerSprite.less': `
    .player-sprite { width: 150px; height: 150px; bottom: calc(100% - 75px); }
    .player-sprite.stunned .player-img { animation: shake 0.5s ease-in-out infinite; }
    .player-img { width: 150px; height: 150px; }
  `,
  'src/pages/GamePage/PlayerArea.less': `
    .player-area { position: absolute; bottom: 0; height: 12%; }
  `,
  'src/pages/GamePage/CoreStage.less': `
    .game-element { width: 84px; height: 84px; }
    .element-heart img, .element-item img, .element-bomb img { width: 84px; height: 84px; }
  `,
  'src/pages/GamePage/CoreStage.tsx': `
    const img = document.createElement('img')
    img.width = 84
    img.height = 84
    node.style.transform = \`translate(\${el.x * 750 - 42}px, \${el.y * 1334 - 42}px)\`
  `,
  'src/data/levels.ts': `
    export const LEVELS = [
      { startTime: 0, endTime: 45, spawnInterval: 1.2, heartProb: 0.57, itemProb: 0.25, bombProb: 0.18 },
      { startTime: 45, endTime: 90, spawnInterval: 1.0, heartProb: 0.48, itemProb: 0.30, bombProb: 0.22 },
      { startTime: 90, endTime: 135, spawnInterval: 0.85, heartProb: 0.39, itemProb: 0.35, bombProb: 0.26 },
      { startTime: 135, endTime: 180, spawnInterval: 0.7, heartProb: 0.35, itemProb: 0.35, bombProb: 0.30 },
    ]
  `,
  'src/pages/GamePage/YenaStage.less': `
    .yena-stage { height: 25%; align-items: flex-start; }
    .yena-img { height: 88%; }
  `,
}

function runVerifier(overrides) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-game-layout-'))
  try {
    for (const [file, source] of Object.entries({ ...validSources, ...overrides })) {
      const target = path.join(fixture, file)
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, source)
    }

    execFileSync(process.execPath, [verifier], { cwd: fixture, stdio: 'pipe' })
    return { status: 0 }
  } catch (error) {
    return { status: error.status, output: `${error.stdout}${error.stderr}` }
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true })
  }
}

function assertFailsWith(result, label) {
  assert.equal(result.status, 1)
  assert.match(result.output, new RegExp(`FAIL: ${label}`))
}

test('rejects PlayerSprite CSS when the visual sizes regress to 120px', () => {
  const result = runVerifier({
    'src/pages/GamePage/PlayerSprite.less': `
      .player-sprite { width: 120px; height: 120px; }
      .player-img { width: 120px; height: 120px; }
    `,
  })

  assertFailsWith(result, 'player sprite CSS is 150 by 150')
  assert.match(result.output, /FAIL: player image CSS is 150 by 150/)
})

test('rejects PlayerSprite CSS when the stun animation is not bound to the image', () => {
  const result = runVerifier({
    'src/pages/GamePage/PlayerSprite.less': `
      .player-sprite { width: 150px; height: 150px; animation: shake 0.5s ease-in-out infinite; }
      .player-img { width: 150px; height: 150px; }
    `,
  })

  assertFailsWith(result, 'player stun animation targets the image')
})

test('rejects element CSS when an element regresses to 60px', () => {
  const result = runVerifier({
    'src/pages/GamePage/CoreStage.less': `
      .game-element { width: 84px; height: 84px; }
      .element-heart img, .element-item img, .element-bomb img { width: 60px; height: 60px; }
    `,
  })

  assertFailsWith(result, 'element images CSS is 84 by 84')
})

test('rejects the game-element container when it regresses to 60px', () => {
  const result = runVerifier({
    'src/pages/GamePage/CoreStage.less': `
      .game-element { width: 60px; height: 60px; }
      .element-heart img, .element-item img, .element-bomb img { width: 84px; height: 84px; }
    `,
  })

  assertFailsWith(result, 'game element CSS is 84 by 84')
})

test('rejects element positioning when it still subtracts 30px', () => {
  const result = runVerifier({
    'src/pages/GamePage/CoreStage.tsx': `
      const img = document.createElement('img')
      img.width = 84
      img.height = 84
      node.style.transform = \`translate(\${el.x * 750 - 30}px, \${el.y * 1334 - 30}px)\`
    `,
  })

  assertFailsWith(result, 'element transform subtracts 42')
})

test('rejects collision code when the element box still uses 50px over 750px', () => {
  const result = runVerifier({
    'src/hooks/useCollision.ts': `
      const PLAYER_WIDTH_NORM = PLAYER_WIDTH / 750
      const PLAYER_HEIGHT_NORM = PLAYER_HEIGHT / 1334
      const ELEMENT_SIZE_NORM = 50 / 750
      const eLeft = elementXNorm - ELEMENT_SIZE_NORM / 2
      const eRight = elementXNorm + ELEMENT_SIZE_NORM / 2
      const eTop = elementYNorm - ELEMENT_SIZE_NORM / 2
      const eBottom = elementYNorm + ELEMENT_SIZE_NORM / 2
    `,
  })

  assertFailsWith(result, 'collision normalizes the 64px element by game width and height')
})

test('rejects a player visual center that uses the player-area height as its percentage base', () => {
  const result = runVerifier({
    'src/pages/GamePage/PlayerSprite.less': `
      .player-sprite { width: 150px; height: 150px; bottom: calc(12% - 75px); }
      .player-sprite.stunned .player-img { animation: shake 0.5s ease-in-out infinite; }
      .player-img { width: 150px; height: 150px; }
    `,
  })

  assertFailsWith(result, 'player visual center aligns with collision center')
})

test('rejects a player-area whose height no longer establishes the 12 percent containing block', () => {
  const result = runVerifier({
    'src/pages/GamePage/PlayerArea.less': `
      .player-area { position: absolute; bottom: 0; height: 25%; }
    `,
  })

  assertFailsWith(result, 'player area is 12 percent high')
})

test('rejects a player-area that is not absolutely positioned', () => {
  const result = runVerifier({
    'src/pages/GamePage/PlayerArea.less': `
      .player-area { position: relative; bottom: 0; height: 12%; }
    `,
  })

  assertFailsWith(result, 'player area is absolutely positioned')
})

test('rejects a player-area that is not anchored to bottom zero', () => {
  const result = runVerifier({
    'src/pages/GamePage/PlayerArea.less': `
      .player-area { position: absolute; bottom: 8px; height: 12%; }
    `,
  })

  assertFailsWith(result, 'player area is anchored to bottom zero')
})

test('rejects probability values copied into an unrelated object', () => {
  const result = runVerifier({
    'src/data/levels.ts': `
      export const LEVELS = [
        { bombProb: 0.20, heartProb: 0.55, itemProb: 0.25 },
        { bombProb: 0.25, heartProb: 0.45, itemProb: 0.30 },
        { bombProb: 0.30, heartProb: 0.35, itemProb: 0.35 },
        { bombProb: 0.35, heartProb: 0.30, itemProb: 0.35 },
      ]
      const unrelatedProbabilityExamples = [
        { heartProb: 0.57, itemProb: 0.25, bombProb: 0.18 },
        { heartProb: 0.48, itemProb: 0.30, bombProb: 0.22 },
        { heartProb: 0.39, itemProb: 0.35, bombProb: 0.26 },
        { heartProb: 0.35, itemProb: 0.35, bombProb: 0.30 },
      ]
    `,
  })

  assertFailsWith(result, 'level probabilities match all four phases')
})

test('accepts a Yena image rule with nested state styles', () => {
  const result = runVerifier({
    'src/pages/GamePage/YenaStage.less': `
      .yena-stage { height: 25%; align-items: flex-start; }
      .yena-img {
        height: 88%;
        &.fever { animation: feverGlow 0.5s ease-in-out infinite alternate; }
      }
    `,
  })

  assert.equal(result.status, 0)
})

for (const [label, failure, yena] of [
  ['stage height', 'Yena stage is 25 percent high', `
    .yena-stage { position: absolute; }
    .unrelated-stage { height: 25%; align-items: flex-start; }
    .yena-img { height: 88%; }
  `],
  ['stage alignment', 'Yena aligns from top', `
    .yena-stage { height: 25%; }
    .unrelated-stage { align-items: flex-start; }
    .yena-img { height: 88%; }
  `],
  ['image height', 'Yena image uses 88 percent height', `
    .yena-stage { height: 25%; align-items: flex-start; }
    .yena-img { object-fit: contain; }
    .unrelated-image { height: 88%; }
  `],
]) {
  test(`rejects Yena ${label} when the declaration exists only in another rule`, () => {
    const result = runVerifier({ 'src/pages/GamePage/YenaStage.less': yena })

    assertFailsWith(result, failure)
  })
}
