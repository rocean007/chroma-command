import { useEffect, useRef, useState, useCallback } from 'react'

export function useTurnTimer(duration = 45, onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const start = useCallback(() => {
    clear()
    setTimeLeft(duration)
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clear()
          setRunning(false)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [duration])

  const stop = useCallback(() => {
    clear()
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    clear()
    setTimeLeft(duration)
    setRunning(false)
  }, [duration])

  useEffect(() => () => clear(), [])

  const urgent = timeLeft <= 10 && running
  const pct = (timeLeft / duration) * 100

  return { timeLeft, running, urgent, pct, start, stop, reset }
}
