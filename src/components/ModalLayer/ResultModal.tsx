import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { startGame, resetToIdle } from '../../store/slices/gameSlice'
import { STAR_THRESHOLDS } from '../../constants/game'
import { ASSETS } from '../../constants/assets'
import { useGameAudio } from '../../hooks/useGameAudio'
import './ResultModal.less'

const STAR_LABELS = ['太厉害了！', '做得不错！', '继续加油！', '再来一次！', '下次会更好！']

export default function ResultModal() {
  const dispatch = useDispatch()
  const { playBGM } = useGameAudio()
  const [shareFeedback, setShareFeedback] = useState('')
  const feedbackTimerRef = useRef<number>()
  const actionLockRef = useRef(false)
  const { score, maxCombo, feverCount, collectedHearts, collectedItems, hitBombs } =
    useSelector((s: RootState) => s.game)

  const stars = useMemo(() => {
    for (const t of [...STAR_THRESHOLDS].reverse()) {
      if (score >= t.minScore) return t.stars
    }
    return 1
  }, [score])

  const starLabel = STAR_LABELS[5 - stars] ?? STAR_LABELS[STAR_LABELS.length - 1]

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  function showShareFeedback(message: string) {
    setShareFeedback(message)
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => setShareFeedback(''), 1500)
  }

  async function copyShareText(text: string) {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable')
    await navigator.clipboard.writeText(text)
  }

  async function handleShare() {
    const text = `YENA Catch Catch! 总分 ${score}，最高 Combo ${maxCombo}，Fever ${feverCount} 次`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'YENA Catch Catch!', text })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await copyShareText(text)
      showShareFeedback('成绩已复制')
    } catch {
      showShareFeedback('分享失败，请稍后重试')
    }
  }

  function runOnce(action: () => void) {
    return (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation()
      e.preventDefault()
      // Mobile browsers often fire touchstart then a synthetic click; guard against double actions.
      if (actionLockRef.current) return
      actionLockRef.current = true
      action()
      window.setTimeout(() => {
        actionLockRef.current = false
      }, 400)
    }
  }

  const handleRetry = runOnce(() => {
    // Unlock/resume audio inside the user gesture — same pattern as HomePage start.
    void playBGM()
    dispatch(startGame())
  })

  const handleHome = runOnce(() => {
    dispatch(resetToIdle())
  })

  const handleShareClick = runOnce(() => {
    void handleShare()
  })

  return (
    <div className="modal-panel result-modal">
      <img
        className="modal-panel-background"
        src={ASSETS.ui.modalBackground}
        alt=""
        draggable={false}
      />
      <div className="modal-panel-content">
        <div className="result-label">{starLabel}</div>
        <div className="stars-row" aria-label={`${stars} 星评价`}>
          {[1, 2, 3, 4, 5].map(i => {
            const isOn = i <= stars
            return (
              <img
                key={i}
                className="star"
                src={isOn ? ASSETS.ui.starOn : ASSETS.ui.starOff}
                alt={`第 ${i} 颗星，${isOn ? '已点亮' : '未点亮'}`}
                draggable={false}
              />
            )
          })}
        </div>
        <div className="result-score">总分: {score}</div>
        <div className="result-stats">
          <div className="stat">最高 Combo: {maxCombo}</div>
          <div className="stat">Fever: {feverCount} 次</div>
          <div className="stat-row">
            <span><img src={ASSETS.elements.heart} alt="" draggable={false} />{collectedHearts}</span>
            <span><img src={ASSETS.elements.item} alt="" draggable={false} />{collectedItems}</span>
            <span><img src={ASSETS.elements.bomb} alt="" draggable={false} />{hitBombs}</span>
          </div>
        </div>
        <div className="result-buttons">
          <button
            type="button"
            className="modal-btn"
            onClick={handleRetry}
            onTouchStart={handleRetry}
          >
            <img src={ASSETS.ui.buttonRetry} alt="再来一局" />
          </button>
          <button
            type="button"
            className="modal-btn"
            onClick={handleShareClick}
            onTouchStart={handleShareClick}
          >
            <img src={ASSETS.ui.buttonShare} alt="分享成绩" />
          </button>
        </div>
        <button
          type="button"
          className="result-home-link"
          onClick={handleHome}
          onTouchStart={handleHome}
        >
          返回主界面
        </button>
        <div className="share-feedback" role="status" aria-live="polite">
          {shareFeedback}
        </div>
      </div>
    </div>
  )
}
