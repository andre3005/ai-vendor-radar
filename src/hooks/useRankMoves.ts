import { useEffect, useRef, useState } from 'react'
import type { ProviderRanking } from '../lib/types'

export interface RankMove { id: number; name: string; from: number; to: number }

/** Detects rank changes between refetches; entries stay for 3 s. */
export function useRankMoves(vendors: ProviderRanking[] | null): Record<number, RankMove> {
  const prev = useRef<Map<number, number>>(new Map())
  const [moves, setMoves] = useState<Record<number, RankMove>>({})
  useEffect(() => {
    if (!vendors) return
    const next: Record<number, RankMove> = {}
    for (const v of vendors) {
      const old = prev.current.get(v.id)
      if (old !== undefined && old !== v.rank) next[v.id] = { id: v.id, name: v.name, from: old, to: v.rank }
    }
    prev.current = new Map(vendors.map(v => [v.id, v.rank]))
    if (Object.keys(next).length) {
      setMoves(next)
      const t = setTimeout(() => setMoves({}), 3000)
      return () => clearTimeout(t)
    }
  }, [vendors])
  return moves
}
