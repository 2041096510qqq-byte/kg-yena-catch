import fs from 'node:fs'
import ts from 'typescript'

const FILES = {
  audio: 'src/hooks/useGameAudio.ts',
  loop: 'src/hooks/useGameLoop.ts',
  home: 'src/pages/HomePage/index.tsx',
  game: 'src/pages/GamePage/index.tsx',
}

const sources = Object.fromEntries(
  Object.entries(FILES).map(([key, file]) => [
    key,
    ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    ),
  ]),
)

const checks = []

function check(label, condition) {
  checks.push({ label, condition: Boolean(condition) })
}

function visit(node, predicate) {
  if (predicate(node)) return node
  let found
  ts.forEachChild(node, child => {
    if (!found) found = visit(child, predicate)
  })
  return found
}

function visitAll(node, predicate) {
  const found = []
  function walk(current) {
    if (predicate(current)) found.push(current)
    ts.forEachChild(current, walk)
  }
  walk(node)
  return found
}

function findFunction(source, name) {
  return visit(source, node =>
    (ts.isFunctionDeclaration(node) && node.name?.text === name)
    || (ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === name
      && Boolean(node.initializer)),
  )
}

function initializerText(source, name) {
  const declaration = visit(source, node =>
    ts.isVariableDeclaration(node)
    && ts.isIdentifier(node.name)
    && node.name.text === name,
  )
  return declaration?.initializer?.getText(source) ?? ''
}

function objectPropertyText(source, variableName, propertyName) {
  const declaration = visit(source, node =>
    ts.isVariableDeclaration(node)
    && ts.isIdentifier(node.name)
    && node.name.text === variableName
    && ts.isObjectLiteralExpression(node.initializer),
  )
  if (!declaration || !ts.isObjectLiteralExpression(declaration.initializer)) return ''
  const property = declaration.initializer.properties.find(candidate =>
    ts.isPropertyAssignment(candidate)
    && candidate.name.getText(source).replaceAll(/['"]/g, '') === propertyName,
  )
  return property && ts.isPropertyAssignment(property)
    ? property.initializer.getText(source)
    : ''
}

function hasCall(node, source, callee, argument) {
  return Boolean(visit(node, candidate => {
    if (!ts.isCallExpression(candidate)) return false
    const expression = candidate.expression.getText(source)
    if (expression !== callee) return false
    return argument === undefined
      || candidate.arguments[0]?.getText(source).replaceAll(/['"]/g, '') === argument
  }))
}

function hasAssignment(node, source, target, value) {
  return Boolean(visit(node, candidate =>
    ts.isBinaryExpression(candidate)
    && candidate.operatorToken.kind === ts.SyntaxKind.EqualsToken
    && candidate.left.getText(source) === target
    && candidate.right.getText(source) === value,
  ))
}

function findIfBranch(source, conditionParts) {
  return visit(source, node =>
    ts.isIfStatement(node)
    && conditionParts.every(part => node.expression.getText(source).includes(part)),
  )
}

function callPosition(node, source, callee) {
  const call = visit(node, candidate =>
    ts.isCallExpression(candidate) && candidate.expression.getText(source) === callee,
  )
  return call?.getStart(source) ?? -1
}

function callsOf(node, source, callee, argument) {
  return visitAll(node, candidate => {
    if (!ts.isCallExpression(candidate)) return false
    if (candidate.expression.getText(source) !== callee) return false
    return argument === undefined
      || candidate.arguments[0]?.getText(source).replaceAll(/['"]/g, '') === argument
  })
}

function isDescendantOf(node, ancestor) {
  let current = node?.parent
  while (current) {
    if (current === ancestor) return true
    current = current.parent
  }
  return false
}

function hasAncestor(node, predicate, boundary) {
  let current = node?.parent
  while (current && current !== boundary) {
    if (predicate(current)) return true
    current = current.parent
  }
  return false
}

function hasComparison(node, source, left, operatorKind, right) {
  return Boolean(visit(node, candidate =>
    ts.isBinaryExpression(candidate)
    && candidate.left.getText(source) === left
    && candidate.operatorToken.kind === operatorKind
    && candidate.right.getText(source) === right,
  ))
}

function parseFixture(name, source) {
  return ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function analyzeLoopEventStructure(source) {
  const heartBranch = findIfBranch(source, ['el.type', 'ElementType.HEART'])
  const itemBranch = findIfBranch(source, ['el.type', 'ElementType.ITEM'])
  const bombBranch = findIfBranch(source, ['el.type', 'ElementType.BOMB'])

  const validBombBranch = bombBranch && visit(bombBranch.thenStatement, node =>
    ts.isIfStatement(node)
    && hasComparison(
      node.expression,
      source,
      'invincibleTimerRef.current',
      ts.SyntaxKind.LessThanEqualsToken,
      '0',
    )
    && hasComparison(
      node.expression,
      source,
      'store.getState().game.subState',
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      'SubState.STUNNED',
    ),
  )
  const bombCalls = callsOf(source, source, 'playSFX', 'bomb')
  const stunCalls = callsOf(source, source, 'playSFX', 'stun')
  const validBombSounds = Boolean(
    validBombBranch
    && bombCalls.length === 1
    && stunCalls.length === 1
    && [...bombCalls, ...stunCalls].every(call =>
      isDescendantOf(call, validBombBranch.thenStatement),
    ),
  )

  const feverGaugeDispatch = itemBranch && visit(itemBranch.thenStatement, node =>
    ts.isCallExpression(node)
    && node.expression.getText(source) === 'dispatch'
    && node.arguments[0]?.getText(source) === 'incrementFeverGauge()',
  )
  const wasFeverDeclaration = itemBranch && visit(itemBranch.thenStatement, node =>
    ts.isVariableDeclaration(node)
    && ts.isIdentifier(node.name)
    && node.name.text === 'wasFever'
    && node.initializer?.getText(source) === 'store.getState().game.subState === SubState.FEVER',
  )
  const feverGuard = itemBranch && visit(itemBranch.thenStatement, node =>
    ts.isIfStatement(node)
    && node.expression.getText(source).includes('!wasFever')
    && node.expression.getText(source).includes('store.getState().game.subState === SubState.FEVER')
    && hasCall(node.thenStatement, source, 'playSFX', 'fever'),
  )
  const feverCalls = callsOf(source, source, 'playSFX', 'fever')
  const itemFeverTransition = Boolean(
    itemBranch
    && wasFeverDeclaration
    && feverGaugeDispatch
    && feverGuard
    && wasFeverDeclaration.getStart(source) < feverGaugeDispatch.getStart(source)
    && feverGaugeDispatch.getEnd() < feverGuard.getStart(source)
    && feverCalls.length === 1
    && feverCalls.every(call => isDescendantOf(call, feverGuard.thenStatement)),
  )

  const comboFunction = findFunction(source, 'checkComboTitle')
  const comboThresholdGuard = comboFunction && visit(comboFunction, node =>
    ts.isIfStatement(node)
    && hasComparison(
      node.expression,
      source,
      'comboRef.current',
      ts.SyntaxKind.GreaterThanEqualsToken,
      't.minCombo',
    )
    && hasComparison(
      node.expression,
      source,
      'comboTitleShownRef.current',
      ts.SyntaxKind.LessThanToken,
      't.level',
    ),
  )
  const comboCalls = comboFunction ? callsOf(comboFunction, source, 'playSFX', 'combo') : []
  const guardedCombo = Boolean(
    comboThresholdGuard
    && comboCalls.length === 1
    && comboCalls.every(call => isDescendantOf(call, comboThresholdGuard.thenStatement)),
  )

  const secondBranch = visit(source, node =>
    ts.isIfStatement(node)
    && hasComparison(
      node.expression,
      source,
      'currentSecond',
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      'lastSecondRef.current',
    )
    && hasComparison(
      node.expression,
      source,
      'currentSecond',
      ts.SyntaxKind.GreaterThanEqualsToken,
      '0',
    ),
  )
  const tickGuard = secondBranch && visit(secondBranch.thenStatement, node =>
    ts.isIfStatement(node)
    && hasComparison(
      node.expression,
      source,
      'remainingSecond',
      ts.SyntaxKind.GreaterThanEqualsToken,
      '1',
    )
    && hasComparison(
      node.expression,
      source,
      'remainingSecond',
      ts.SyntaxKind.LessThanEqualsToken,
      '10',
    )
    && hasCall(node.thenStatement, source, 'playSFX', 'tick'),
  )
  const tickCalls = callsOf(source, source, 'playSFX', 'tick')
  const guardedSecondTick = Boolean(
    secondBranch
    && tickGuard
    && isDescendantOf(tickGuard, secondBranch.thenStatement)
    && tickCalls.length === 1
    && tickCalls.every(call => isDescendantOf(call, tickGuard.thenStatement)),
  )

  return {
    heart: Boolean(heartBranch && hasCall(heartBranch.thenStatement, source, 'playSFX', 'heart')),
    item: Boolean(itemBranch && hasCall(itemBranch.thenStatement, source, 'playSFX', 'item')),
    bomb: validBombSounds,
    fever: itemFeverTransition,
    combo: guardedCombo,
    tick: guardedSecondTick,
  }
}

const audio = sources.audio
const loop = sources.loop
const home = sources.home
const game = sources.game

const bgmDeclaration = visit(audio, node =>
  ts.isVariableDeclaration(node)
  && ts.isIdentifier(node.name)
  && node.name.text === 'bgmAudio',
)
check(
  'BGM is a module-level shared nullable audio element',
  bgmDeclaration
    && bgmDeclaration.parent.parent.parent === audio
    && bgmDeclaration.type?.getText(audio).includes('HTMLAudioElement')
    && bgmDeclaration.initializer?.kind === ts.SyntaxKind.NullKeyword,
)

const getBGM = findFunction(audio, 'getBGM')
check(
  'BGM lazily loads ASSETS.audio.bgmGame',
  getBGM
    && getBGM.getText(audio).includes('new Audio(ASSETS.audio.bgmGame)'),
)
check('BGM loops', getBGM && hasAssignment(getBGM, audio, 'bgmAudio.loop', 'true'))
check('BGM volume is 0.35', getBGM && hasAssignment(getBGM, audio, 'bgmAudio.volume', '0.35'))

check('heart maps to score bonus file', objectPropertyText(audio, 'FILE_SFX', 'heart') === 'ASSETS.audio.scoreBonus')
check('item maps to score bonus file', objectPropertyText(audio, 'FILE_SFX', 'item') === 'ASSETS.audio.scoreBonus')
check('bomb maps to explosion file', objectPropertyText(audio, 'FILE_SFX', 'bomb') === 'ASSETS.audio.explosion')
check('fever maps to fever boost file', objectPropertyText(audio, 'FILE_SFX', 'fever') === 'ASSETS.audio.feverBoost')

const playBGM = findFunction(audio, 'playBGM')
const pauseBGM = findFunction(audio, 'pauseBGM')
const stopBGM = findFunction(audio, 'stopBGM')
const playSFX = findFunction(audio, 'playSFX')
check('playBGM is a stable callback and catches play rejection', initializerText(audio, 'playBGM').startsWith('useCallback(') && playBGM?.getText(audio).includes('.catch('))
const contextCreationCall = playBGM && visit(playBGM, node =>
  ts.isCallExpression(node) && node.expression.getText(audio) === 'getAudioContext',
)
const contextResumeCall = playBGM && visit(playBGM, node =>
  ts.isCallExpression(node) && node.expression.getText(audio) === 'ctx.resume',
)
const bgmPlayCall = playBGM && visit(playBGM, node =>
  ts.isCallExpression(node) && node.expression.getText(audio) === 'getBGM().play',
)
const contextResumeGuard = contextResumeCall && hasAncestor(
  contextResumeCall,
  node =>
    ts.isIfStatement(node)
    && hasComparison(
      node.expression,
      audio,
      'ctx.state',
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      "'running'",
    ),
  playBGM,
)
const caughtResumePromise = contextResumeCall && hasAncestor(
  contextResumeCall,
  node =>
    ts.isCallExpression(node)
    && ts.isPropertyAccessExpression(node.expression)
    && node.expression.name.text === 'catch',
  playBGM,
)
const firstAwait = playBGM && visit(playBGM, node => ts.isAwaitExpression(node))
check(
  'playBGM synchronously unlocks the shared AudioContext',
  contextCreationCall
    && contextResumeCall
    && bgmPlayCall
    && contextCreationCall.getStart(audio) < contextResumeCall.getStart(audio)
    && contextResumeCall.getStart(audio) < bgmPlayCall.getStart(audio)
    && (!firstAwait || contextResumeCall.getStart(audio) < firstAwait.getStart(audio))
    && contextResumeGuard
    && caughtResumePromise
    && hasAncestor(contextCreationCall, ts.isTryStatement, playBGM),
)
check('pauseBGM pauses without resetting time', initializerText(audio, 'pauseBGM').startsWith('useCallback(') && hasCall(pauseBGM, audio, 'bgmAudio?.pause') && !pauseBGM?.getText(audio).includes('currentTime'))
const stopSharedBGM = findFunction(audio, 'stopSharedBGM')
check('stopBGM pauses and resets time', initializerText(audio, 'stopBGM').startsWith('useCallback(') && stopSharedBGM && hasCall(stopBGM, audio, 'stopSharedBGM') && hasCall(stopSharedBGM, audio, 'bgmAudio?.pause') && hasAssignment(stopSharedBGM, audio, 'bgmAudio.currentTime', '0'))
check('file SFX uses a fresh Audio instance at volume 0.65', initializerText(audio, 'playSFX').startsWith('useCallback(') && playSFX?.getText(audio).includes('new Audio(file)') && hasAssignment(playSFX, audio, 'audio.volume', '0.65'))
check('file SFX failures fall back without unhandled rejection', playSFX?.getText(audio).includes('playSyntheticSFX(type)') && playSFX?.getText(audio).includes('.catch('))

const useGameAudio = findFunction(audio, 'useGameAudio')
const returnedAudioApi = visit(useGameAudio, node =>
  ts.isReturnStatement(node)
  && Boolean(node.expression)
  && ts.isObjectLiteralExpression(node.expression),
)
const audioApiProperties = returnedAudioApi && ts.isObjectLiteralExpression(returnedAudioApi.expression)
  ? returnedAudioApi.expression.properties.map(property => property.name?.getText(audio))
  : []
check(
  'useGameAudio exposes the complete lifecycle API',
  ['playBGM', 'pauseBGM', 'stopBGM', 'playSFX'].every(name => audioApiProperties.includes(name)),
)

const handleStart = findFunction(home, 'handleStart')
const homePlayPosition = callPosition(handleStart, home, 'playBGM')
const homeDispatchPosition = callPosition(handleStart, home, 'dispatch')
check(
  'HomePage starts BGM before dispatching startGame',
  hasCall(handleStart, home, 'dispatch')
    && handleStart?.getText(home).includes('dispatch(startGame())')
    && homePlayPosition >= 0
    && homePlayPosition < homeDispatchPosition,
)

const gameEffects = visitAll(game, node =>
  ts.isCallExpression(node) && node.expression.getText(game) === 'useEffect',
)
const lifecycleEffect = gameEffects.find(effect => effect.getText(game).includes('GameState.COUNTDOWN'))
const cleanupEffect = gameEffects.find(effect => effect.getText(game).includes('retainGameAudioOwner'))
check('COUNTDOWN resets timers and plays BGM', lifecycleEffect?.getText(game).includes('resetElapsedTime()') && lifecycleEffect?.getText(game).includes('resetAllTimers()') && lifecycleEffect?.getText(game).includes('playBGM()'))
check('PLAYING starts the loop and resumes BGM', lifecycleEffect?.getText(game).includes('startLoop()') && lifecycleEffect?.getText(game).match(/GameState\.PLAYING[\s\S]*playBGM\(\)/))
check('PAUSED stops the loop and pauses BGM', lifecycleEffect?.getText(game).match(/GameState\.PAUSED[\s\S]*stopLoop\(\)[\s\S]*pauseBGM\(\)/))
check('RESULT or other state stops loop and BGM', lifecycleEffect?.getText(game).match(/else\s*{[\s\S]*stopLoop\(\)[\s\S]*stopBGM\(\)/))
const retainOwner = findFunction(audio, 'retainGameAudioOwner')
const releaseOwner = findFunction(audio, 'releaseGameAudioOwner')
const delayedStop = releaseOwner && visit(releaseOwner, node =>
  ts.isCallExpression(node) && node.expression.getText(audio) === 'queueMicrotask',
)
const delayedStopCallback = delayedStop?.arguments[0]
check(
  'GamePage unmount uses a StrictMode-safe delayed owner release',
  cleanupEffect
    && hasCall(cleanupEffect, game, 'retainGameAudioOwner')
    && hasCall(cleanupEffect, game, 'releaseGameAudioOwner')
    && retainOwner
    && releaseOwner
    && delayedStop
    && delayedStopCallback
    && delayedStopCallback.getText(audio).includes('activeGameAudioOwners === 0')
    && delayedStopCallback.getText(audio).includes('releaseToken === gameAudioOwnerToken')
    && hasCall(delayedStopCallback, audio, 'stopSharedBGM'),
)

const eventStructure = analyzeLoopEventStructure(loop)
check('heart collision plays heart SFX', eventStructure.heart)
check('item collision plays item SFX', eventStructure.item)
check(
  'only a valid bomb collision plays bomb and stun SFX',
  eventStructure.bomb,
)
check('entering Fever is proven by item dispatch-before/after state transition', eventStructure.fever)
check('new combo title plays combo SFX only inside the threshold guard', eventStructure.combo)
check('remaining 1-10 seconds plays one tick structurally inside the second-level branch', eventStructure.tick)

const validEventFixture = `
function handleCollision(el) {
  if (el.type === ElementType.BOMB) {
    if (invincibleTimerRef.current <= 0 && store.getState().game.subState !== SubState.STUNNED) {
      playSFX('bomb')
      playSFX('stun')
    }
  } else if (el.type === ElementType.HEART) {
    playSFX('heart')
  } else if (el.type === ElementType.ITEM) {
    playSFX('item')
    const wasFever = store.getState().game.subState === SubState.FEVER
    dispatch(incrementFeverGauge())
    if (!wasFever && store.getState().game.subState === SubState.FEVER) {
      playSFX('fever')
    }
  }
}
function checkComboTitle() {
  if (comboRef.current >= t.minCombo && comboTitleShownRef.current < t.level) {
    playSFX('combo')
  }
}
function loop() {
  if (currentSecond !== lastSecondRef.current && currentSecond >= 0) {
    if (remainingSecond >= 1 && remainingSecond <= 10) {
      playSFX('tick')
    }
  }
}
`
const tickOutsideFixture = validEventFixture.replace(
  `    if (remainingSecond >= 1 && remainingSecond <= 10) {
      playSFX('tick')
    }`,
  `    if (remainingSecond >= 1 && remainingSecond <= 10) {}
  }
  playSFX('tick')
  if (false) {`,
)
const unrelatedFeverFixture = validEventFixture.replace(
  `    if (!wasFever && store.getState().game.subState === SubState.FEVER) {
      playSFX('fever')
    }`,
  `    if (!wasFever && store.getState().game.subState === SubState.FEVER) {}
    if (currentSubState === SubState.FEVER) {
      playSFX('fever')
    }`,
)
const stunOutsideFixture = validEventFixture.replace(
  `      playSFX('stun')`,
  `      // missing guarded stun`,
).replace(
  `function checkComboTitle()`,
  `playSFX('stun')
function checkComboTitle()`,
)
const comboOutsideFixture = validEventFixture.replace(
  `    playSFX('combo')`,
  `    // missing guarded combo`,
).replace(
  `function loop()`,
  `playSFX('combo')
function loop()`,
)
check(
  'verifier self-check rejects tick outside the second-level branch',
  !analyzeLoopEventStructure(parseFixture('tick-outside.ts', tickOutsideFixture)).tick,
)
check(
  'verifier self-check rejects unrelated FEVER condition',
  !analyzeLoopEventStructure(parseFixture('unrelated-fever.ts', unrelatedFeverFixture)).fever,
)
check(
  'verifier self-check rejects stun outside the valid bomb branch',
  !analyzeLoopEventStructure(parseFixture('stun-outside.ts', stunOutsideFixture)).bomb,
)
check(
  'verifier self-check rejects combo outside its threshold guard',
  !analyzeLoopEventStructure(parseFixture('combo-outside.ts', comboOutsideFixture)).combo,
)

const failures = checks.filter(result => !result.condition)
for (const failure of failures) {
  console.error(`FAIL: ${failure.label}`)
}

if (failures.length > 0) {
  process.exitCode = 1
} else {
  console.log(`verified ${checks.length} game audio contracts`)
}
