import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useQuery, useRanking } from '../hooks/useQueries'
import { useAction } from '../hooks/useAction'
import type { Incident } from '../lib/types'
import Sheet from '../components/Sheet'
import Dialog from '../components/Dialog'
import Segmented from '../components/Segmented'
import { PillMenu } from '../components/Popover'
import IncidentForm from '../components/IncidentForm'
import IncidentRow from '../components/IncidentRow'
import IncidentSheet from '../components/IncidentSheet'

type Group = 'all' | 'open' | 'confirmed' | 'closed'
const GROUPS: Record<Group, string[] | null> = {
  all: null, open: ['reported', 'under_investigation', 'appealed'], confirmed: ['confirmed', 'fine_imposed'], closed: ['annulled'],
}
const SEV: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 }

export default function Incidents() {
  const act = useAction()
  const [params, setParams] = useSearchParams()
  const { data: vendors } = useRanking()
  const { data, loading, error, retry } = useQuery<Incident[]>(() => supabase.from('incident')
    .select('*, provider:provider_id(id, name)').order('occurred_on', { ascending: false }) as never)

  const [group, setGroup] = useState<Group>('all')
  const [vendor, setVendor] = useState('')
  const [sort, setSort] = useState<'date' | 'severity'>('date')
  const [openId, setOpenId] = useState<number | null>(null)
  const [creating, setCreating] = useState(params.get('new') === '1')
  const [retract, setRetract] = useState<Incident | null>(null)
  useEffect(() => { if (params.get('new') === '1') setCreating(true) }, [params])

  const list = useMemo(() => {
    const allow = GROUPS[group]
    const l = (data ?? []).filter(i => (!allow || allow.includes(i.status)) && (!vendor || String(i.provider_id) === vendor))
    if (sort === 'severity') l.sort((a, b) => SEV[b.severity] - SEV[a.severity] || b.occurred_on.localeCompare(a.occurred_on))
    return l
  }, [data, group, vendor, sort])

  const current = data?.find(i => i.id === openId) ?? null
  const closeNew = () => { setCreating(false); if (params.has('new')) setParams({}, { replace: true }) }

  if (error && !data) {
    return <div className="card" role="alert" style={{ marginTop: 32 }}><p>The database isn't responding. It may be waking up after a pause.</p><button className="btn" style={{ marginTop: 16 }} onClick={retry}>Retry</button></div>
  }

  return (
    <>
      <div className="page-head"><h1 className="large-title">Incidents</h1></div>
      <div className="filters">
        <Segmented label="Status group" value={group} onChange={setGroup}
          options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'closed', label: 'Closed' }]} />
        <PillMenu label="Vendor" value={vendor} onChange={setVendor}
          options={[{ value: '', label: 'All vendors' }, ...(vendors ?? []).map(v => ({ value: String(v.id), label: v.name }))]} />
        <PillMenu label="Sort" value={sort} onChange={setSort}
          options={[{ value: 'date', label: 'Newest first' }, { value: 'severity', label: 'Most severe first' }]} />
      </div>
      <div className="inset">
        {loading && !data && Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton row" />)}
        {data && list.length === 0 && (
          <div className="empty"><p>No incidents match this filter.</p><button className="link" onClick={() => { setGroup('all'); setVendor('') }}>Show all</button></div>
        )}
        <ul className="rows">
          {list.map(i => <li key={i.id}><IncidentRow inc={i} showVendor onOpen={() => setOpenId(i.id)} /></li>)}
        </ul>
      </div>

      <IncidentSheet inc={current} onClose={() => setOpenId(null)} onRetract={setRetract} />
      <Sheet open={creating} title="Report incident" onClose={closeNew} action={{ label: 'Save', form: 'sheet-form' }}>
        <IncidentForm vendors={vendors ?? []} onDone={closeNew} />
      </Sheet>
      {retract && (
        <Dialog title="Retract this incident?" confirmLabel="Retract incident" danger onCancel={() => setRetract(null)}
          onConfirm={async () => { await act(supabase.from('incident').delete().eq('id', retract.id), 'Incident retracted'); setRetract(null); setOpenId(null) }}>
          The vendor's score will be recalculated.
        </Dialog>
      )}
    </>
  )
}
