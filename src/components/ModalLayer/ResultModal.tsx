import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { startGame, resetToIdle } from '../../store/slices/gameSlice'
import { STAR_THRESHOLDS } from '../../constants/game'
import { ASSETS } from '../../constants/assets'
import { ImageButton } from '../ImageButton'
import './ResultModal.less'

const STAR_LABELS = ['太厉害了！', '做得不错！', '继续加油！', '再来一次！', '下次会更好！']

export default function ResultModal() {
  const dispatch = useDispatch()
  const [shareFeedback, setShareFeedback] = useState('')
  const feedbackTimerRef = useRef<number>()
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
          <ImageButton
            className="modal-btn"
            src={ASSETS.ui.buttonRetry}
            label="再来一局"
            onClick={() => dispatch(startGame())}
          />
          <ImageButton
            className="modal-btn"
            src={ASSETS.ui.buttonShare}
            label="分享成绩"
            onClick={handleShare}
          />
        </div>
        <button
          type="button"
          className="result-home-link"
          onClick={() => dispatch(resetToIdle())}
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
