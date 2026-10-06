import { supabase } from '../lib/supabase'
import { STATUS_LABEL } from '../lib/labels'
import type { IncidentStatus } from '../lib/types'
import { useAction } from '../hooks/useAction'

/** Pill that is also the quick-change dropdown. */
export default function StatusPill({ id, status }: { id: number; status: IncidentStatus }) {
  const act = useAction()
  return (
    <select
      className={`pill pill-${status}`} aria-label="Incident status" value={status}
      onChange={e => act(supabase.from('incident').update({ status: e.target.value }).eq('id', id), 'Changes saved')}
    >
      {(Object.keys(STATUS_LABEL) as IncidentStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
    </select>
  )
}
