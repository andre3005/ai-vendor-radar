import { useEffect, useRef, useState } from 'react'

/** Tweens a number to its new value (600 ms ease-out). Jumps when reduced motion is on. */
export function useCountUp(value: number, ms = 600) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); from.current = value; return }
    const start = performance.now(); const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      const v = a + (value - a) * e
      setShown(v); from.current = v
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return shown
}
