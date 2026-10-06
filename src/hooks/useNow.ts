import { useEffect, useState } from 'react'

/** Re-renders every `ms` so relative times stay fresh. */
export function useNow(ms = 15000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}
