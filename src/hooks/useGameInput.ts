import { useEffect, useRef } from 'react'
import { FrameInput } from '../constants/enum'

function isUiControl(target: EventTarget | null) {
  return target instanceof Element
    && Boolean(target.closest('button, a, input, textarea, select, label, [role="button"]'))
}

export function useGameInput() {
  const frameInputRef = useRef<FrameInput>({
    pointerX: null,
    pointerActive: false,
  })

  useEffect(() => {
    let ignoreUiGesture = false

    function getNormalizedX(clientX: number): number {
      const stage = document.querySelector('.game-stage') as HTMLElement
      if (!stage) return 0.5
      const rect = stage.getBoundingClientRect()
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    }

    function onTouchStart(e: TouchEvent) {
      // Don't steal taps on buttons/links — preventDefault here would suppress their click.
      ignoreUiGesture = isUiControl(e.target)
      if (ignoreUiGesture) return

      e.preventDefault()
      const t = e.touches[0]
      frameInputRef.current = { pointerX: getNormalizedX(t.clientX), pointerActive: true }
    }

    function onTouchMove(e: TouchEvent) {
      if (ignoreUiGesture) return
      e.preventDefault()
      if (!frameInputRef.current.pointerActive) return
      const t = e.touches[0]
      frameInputRef.current.pointerX = getNormalizedX(t.clientX)
    }

    function onTouchEnd() {
      if (ignoreUiGesture) {
        ignoreUiGesture = false
        return
      }
      frameInputRef.current = { pointerX: null, pointerActive: false }
    }

    function onMouseDown(e: MouseEvent) {
      if (isUiControl(e.target)) return
      frameInputRef.current = { pointerX: getNormalizedX(e.clientX), pointerActive: true }
    }

    function onMouseMove(e: MouseEvent) {
      if (!frameInputRef.current.pointerActive) return
      frameInputRef.current.pointerX = getNormalizedX(e.clientX)
    }

    function onMouseUp() {
      frameInputRef.current = { pointerX: null, pointerActive: false }
    }

    const opts = { passive: false }
    document.addEventListener('touchstart', onTouchStart, opts)
    document.addEventListener('touchmove', onTouchMove, opts)
    document.addEventListener('touchend', onTouchEnd, opts)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return { frameInputRef }
}
