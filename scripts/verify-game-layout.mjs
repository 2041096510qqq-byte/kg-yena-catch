import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const sources = {
  game: read('src/constants/game.ts'),
  elements: read('src/hooks/useGameElements.ts'),
  particles: read('src/hooks/useParticles.ts'),
  collision: read('src/hooks/useCollision.ts'),
  player: read('src/pages/GamePage/PlayerSprite.tsx'),
  playerStyles: read('src/pages/GamePage/PlayerSprite.less'),
  playerAreaStyles: read('src/pages/GamePage/PlayerArea.less'),
  coreStage: read('src/pages/GamePage/CoreStage.tsx'),
  coreStageStyles: read('src/pages/GamePage/CoreStage.less'),
  levels: read('src/data/levels.ts'),
  yena: read('src/pages/GamePage/YenaStage.less'),
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const ruleBody = (source, selector) => {
  const match = new RegExp(`(?:^|\\n)\\s*${escapeRegExp(selector)}\\s*\\{`).exec(source)
  if (!match) return ''

  const start = match.index + match[0].length
  let depth = 1
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}' && --depth === 0) return source.slice(start, index)
  }
  return ''
}
const topLevelDeclarations = (body) => {
  let depth = 0
  return [...body].map((character) => {
    if (character === '{') depth += 1
    if (character === '}' && depth > 0) depth -= 1
    return depth === 0 ? character : ' '
  }).join('')
}
const ruleIncludes = (source, selector, pattern) =>
  pattern.test(topLevelDeclarations(ruleBody(source, selector)))
const allElementImageRule = /(?:^|\n)\s*\.element-heart img\s*,\s*\.element-item img\s*,\s*\.element-bomb img\s*\{([\s\S]*?)\}/
const elementImageRuleIncludes = (pattern) => {
  const match = allElementImageRule.exec(sources.coreStageStyles)
  return Boolean(match && pattern.test(topLevelDeclarations(match[1])))
}
const withoutComments = (source) => source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
const balancedBody = (source, openingIndex, opening, closing) => {
  let depth = 0
  for (let index = openingIndex; index < source.length; index += 1) {
    if (source[index] === opening) depth += 1
    if (source[index] === closing && --depth === 0) {
      return { body: source.slice(openingIndex + 1, index), end: index }
    }
  }
  return null
}
const levelsSource = withoutComments(sources.levels)
const levelsDeclaration = /export\s+const\s+LEVELS\b[^=]*=\s*\[/.exec(levelsSource)
const levelsArray = levelsDeclaration
  ? balancedBody(levelsSource, levelsDeclaration.index + levelsDeclaration[0].lastIndexOf('['), '[', ']')
  : null
const levelObjects = []
if (levelsArray) {
  for (let index = 0; index < levelsArray.body.length; index += 1) {
    if (levelsArray.body[index] !== '{') continue
    const level = balancedBody(levelsArray.body, index, '{', '}')
    if (!level) break
    levelObjects.push(level.body)
    index = level.end
  }
}
const probabilityFromLevel = (level, name) => {
  const match = new RegExp(`\\b${name}\\s*:\\s*(\\d+(?:\\.\\d+)?)\\b`).exec(level)
  return match ? Number(match[1]) : Number.NaN
}
const expectedProbabilities = [
  [0.57, 0.25, 0.18],
  [0.48, 0.30, 0.22],
  [0.39, 0.35, 0.26],
  [0.35, 0.35, 0.30],
]
const actualProbabilities = levelObjects.map((level) => [
  probabilityFromLevel(level, 'heartProb'),
  probabilityFromLevel(level, 'itemProb'),
  probabilityFromLevel(level, 'bombProb'),
])

const checks = [
  ['player visual size is 150', () => /PLAYER_VISUAL_SIZE\s*=\s*150/.test(sources.game)],
  ['game width is 750', () => /GAME_WIDTH\s*=\s*750/.test(sources.game)],
  ['game height is 1334', () => /GAME_HEIGHT\s*=\s*1334/.test(sources.game)],
  ['player collision width is 80', () => /PLAYER_WIDTH\s*=\s*80/.test(sources.game)],
  ['player collision height is 80', () => /PLAYER_HEIGHT\s*=\s*80/.test(sources.game)],
  ['element collision size is 64', () => /ELEMENT_SIZE\s*=\s*64/.test(sources.game)],
  ['particle scale is 2.2', () => /PARTICLE_SIZE_SCALE\s*=\s*2\.2/.test(sources.game)],
  ['spawn minimum is 0.08', () => /ELEMENT_SPAWN_MIN_X\s*=\s*0\.08/.test(sources.game)],
  ['spawn maximum is 0.92', () => /ELEMENT_SPAWN_MAX_X\s*=\s*0\.92/.test(sources.game)],
  ['player rendering centers with visual size', () => /xRef\.current\s*\*\s*750\s*-\s*PLAYER_VISUAL_SIZE\s*\/\s*2/.test(sources.player)],
  ['player sprite CSS is 150 by 150', () =>
    ruleIncludes(sources.playerStyles, '.player-sprite', /width:\s*150px/) &&
    ruleIncludes(sources.playerStyles, '.player-sprite', /height:\s*150px/)],
  ['player image CSS is 150 by 150', () =>
    ruleIncludes(sources.playerStyles, '.player-img', /width:\s*150px/) &&
    ruleIncludes(sources.playerStyles, '.player-img', /height:\s*150px/)],
  ['player stun animation targets the image', () =>
    ruleIncludes(sources.playerStyles, '.player-sprite.stunned .player-img', /animation\s*:/)],
  ['player visual center aligns with collision center', () =>
    ruleIncludes(sources.playerStyles, '.player-sprite', /bottom:\s*calc\(100%\s*-\s*75px\)/) &&
    /const\s+PLAYER_Y_NORM\s*=\s*0\.88/.test(sources.collision) &&
    !/\bbottom\s*:/.test(withoutComments(sources.player))],
  ['player area is 12 percent high', () =>
    ruleIncludes(sources.playerAreaStyles, '.player-area', /height:\s*12%/)],
  ['player area is absolutely positioned', () =>
    ruleIncludes(sources.playerAreaStyles, '.player-area', /position:\s*absolute(?:\s*;|\s*$)/)],
  ['player area is anchored to bottom zero', () =>
    ruleIncludes(sources.playerAreaStyles, '.player-area', /bottom:\s*0(?:px)?(?:\s*;|\s*$)/)],
  ['game element CSS is 84 by 84', () =>
    ruleIncludes(sources.coreStageStyles, '.game-element', /width:\s*84px/) &&
    ruleIncludes(sources.coreStageStyles, '.game-element', /height:\s*84px/)],
  ['element images CSS is 84 by 84', () =>
    elementImageRuleIncludes(/width:\s*84px/) && elementImageRuleIncludes(/height:\s*84px/)],
  ['element image attributes are 84 by 84', () =>
    /img\.width\s*=\s*84/.test(sources.coreStage) && /img\.height\s*=\s*84/.test(sources.coreStage)],
  ['element transform subtracts 42', () =>
    /node\.style\.transform\s*=\s*`translate\(\$\{el\.x\s*\*\s*750\s*-\s*42\}px,\s*\$\{el\.y\s*\*\s*1334\s*-\s*42\}px\)`/.test(sources.coreStage)],
  ['collision normalizes the 64px element by game width and height', () =>
    /ELEMENT_WIDTH_NORM\s*=\s*ELEMENT_SIZE\s*\/\s*GAME_WIDTH/.test(sources.collision) &&
    /ELEMENT_HEIGHT_NORM\s*=\s*ELEMENT_SIZE\s*\/\s*GAME_HEIGHT/.test(sources.collision) &&
    /eLeft\s*=\s*elementXNorm\s*-\s*ELEMENT_WIDTH_NORM\s*\/\s*2/.test(sources.collision) &&
    /eRight\s*=\s*elementXNorm\s*\+\s*ELEMENT_WIDTH_NORM\s*\/\s*2/.test(sources.collision) &&
    /eTop\s*=\s*elementYNorm\s*-\s*ELEMENT_HEIGHT_NORM\s*\/\s*2/.test(sources.collision) &&
    /eBottom\s*=\s*elementYNorm\s*\+\s*ELEMENT_HEIGHT_NORM\s*\/\s*2/.test(sources.collision)],
  ['element spawning uses both bounds', () => /ELEMENT_SPAWN_MIN_X\s*\+\s*Math\.random\(\)\s*\*\s*\(ELEMENT_SPAWN_MAX_X\s*-\s*ELEMENT_SPAWN_MIN_X\)/.test(sources.elements)],
  ['particle creation applies scale', () => /size:\s*cfg\.size\s*\*\s*PARTICLE_SIZE_SCALE/.test(sources.particles)],
  ['level probabilities match all four phases', () =>
    actualProbabilities.length === expectedProbabilities.length &&
    actualProbabilities.every((probability, index) =>
      probability.every((value, probabilityIndex) => value === expectedProbabilities[index][probabilityIndex]))],
  ['level probability totals are one', () =>
    actualProbabilities.length === expectedProbabilities.length &&
    actualProbabilities.every((probability) => Math.abs(probability.reduce((sum, value) => sum + value, 0) - 1) < Number.EPSILON)],
  ['Yena stage is 25 percent high', () => ruleIncludes(sources.yena, '.yena-stage', /height:\s*25%/)],
  ['Yena aligns from top', () => ruleIncludes(sources.yena, '.yena-stage', /align-items:\s*flex-start/)],
  ['Yena image uses 88 percent height', () => ruleIncludes(sources.yena, '.yena-img', /height:\s*88%/)],
]

const failures = checks.filter(([, passes]) => !passes())
if (failures.length > 0) {
  for (const [label] of failures) console.error(`FAIL: ${label}`)
  process.exit(1)
}

console.log(`verified ${checks.length} game layout contracts`)
