import { useCallback } from 'react'
import { friendlyError } from '../lib/errors'
import { useToast } from '../components/Toast'
import { useDataVersion } from './useRealtimeRefresh'

/** Runs a Supabase write, shows a toast (success text or mapped error), refreshes data. Returns true on success. */
export function useAction() {
  const toast = useToast()
  const { refresh } = useDataVersion()
  return useCallback(async (p: PromiseLike<{ error: unknown }>, success: string): Promise<boolean> => {
    try {
      const { error } = await p
      if (error) { toast(friendlyError(error)); return false }
    } catch {
      toast(friendlyError(null)); return false
    }
    toast(success)
    refresh()
    return true
  }, [toast, refresh])
}
