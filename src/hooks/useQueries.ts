import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useDataVersion } from './useRealtimeRefresh'
import type { ActivityLog, Criterion, ProviderRanking } from '../lib/types'

export interface QueryState<T> { data: T | null; loading: boolean; error: boolean; retry: () => void }

/** Runs `fn` on mount and again whenever realtime data changes. Keeps old data while refetching. */
export function useQuery<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>, deps: unknown[] = []): QueryState<T> {
  const { version } = useDataVersion()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    Promise.resolve(fn()).then(
      r => {
        if (!alive) return
        if (r.error) setError(true)
        else { setData(r.data); setError(false) }
        setLoading(false)
      },
      () => { if (alive) { setError(true); setLoading(false) } },
    )
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, tick, ...deps])

  const retry = useCallback(() => { setLoading(true); setTick(t => t + 1) }, [])
  return { data, loading, error, retry }
}

export const useRanking = () =>
  useQuery<ProviderRanking[]>(() => supabase.from('provider_ranking').select('*').order('rank').order('name'))

export const useCriteria = () =>
  useQuery<Criterion[]>(() => supabase.from('criterion').select('*').order('sort_order'))

export const useActivity = (limit = 30) =>
  useQuery<ActivityLog[]>(() => supabase.from('activity_log').select('*').order('id', { ascending: false }).limit(limit), [limit])
