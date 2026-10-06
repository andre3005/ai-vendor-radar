import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

const TABLES = ['provider', 'criterion', 'rating', 'incident', 'data_center', 'activity_log']

interface DataCtx { version: number; refresh: () => void }
const Ctx = createContext<DataCtx>({ version: 0, refresh: () => {} })
export const useDataVersion = () => useContext(Ctx)

/** One realtime channel for the whole app; any change bumps `version` (debounced ~300 ms). */
export function DataProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  const refresh = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setVersion(v => v + 1), 300)
  }, [])

  useEffect(() => {
    let ch = supabase.channel('db-changes')
    for (const table of TABLES) {
      ch = ch.on('postgres_changes', { event: '*', schema: 'public', table }, refresh)
    }
    ch.subscribe()
    return () => { window.clearTimeout(timer.current); supabase.removeChannel(ch) }
  }, [refresh])

  return <Ctx.Provider value={{ version, refresh }}>{children}</Ctx.Provider>
}
