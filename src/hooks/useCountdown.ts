import { useState, useEffect, useRef } from 'react'

export function useCountdown(seconds: number, onEnd: () => void) {
  const [count, setCount] = useState(seconds)
  const [isCounting, setIsCounting] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    setCount(seconds)
    setIsCounting(true)

    intervalRef.current = setInterval(() => {
      setCount(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [seconds]) // only re-run if seconds changes

  useEffect(() => {
    if (!isCounting || count > 0) return

    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsCounting(false)
    onEndRef.current()
  }, [count, isCounting])

  return { count, isCounting }
}
