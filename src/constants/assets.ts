const BASE = '/kg-yena-catch'
const IMG = `${BASE}/assets/imgs`
const AUDIO = `${BASE}/assets/audio`

export const ASSETS = {
  background: {
    game: `${IMG}/game-background.png`,
  },
  characters: {
    yena: {
      normal: `${IMG}/yena-normal.png`,
      throw: `${IMG}/yena-throw.png`,
      fever: `${IMG}/yena-fever.png`,
      angry: `${IMG}/yena-angry.png`,
    },
    player: {
      default: `${IMG}/player-default.png`,
    },
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
    modalBackground: `${IMG}/ui-modal-background1.png`,
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
  audio: {
    bgmGame: `${AUDIO}/bgm-game.m4a`,
    scoreBonus: `${AUDIO}/sfx_score_bonus.wav`,
    explosion: `${AUDIO}/sfx_explosion.wav`,
    feverBoost: `${AUDIO}/sfx_fever_boost.wav`,
  },
} as const
