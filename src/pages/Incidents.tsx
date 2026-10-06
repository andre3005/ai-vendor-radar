import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useQuery, useRanking } from '../hooks/useQueries'
import { useAction } from '../hooks/useAction'
import type { Incident, IncidentStatus, IncidentType, Severity } from '../lib/types'
import { SEVERITY_LABEL, STATUS_LABEL, TYPE_LABEL } from '../lib/labels'
import Drawer from '../components/Drawer'
import Dialog from '../components/Dialog'
import IncidentForm from '../components/IncidentForm'
import IncidentItem from '../components/IncidentItem'

const SEV_ORDER: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 }

export default function Incidents() {
  const act = useAction()
  const [params, setParams] = useSearchParams()
  const { data: vendors } = useRanking()
  const { data, loading, error, retry } = useQuery<Incident[]>(() => supabase.from('incident')
    .select('*, provider:provider_id(id, name)').order('occurred_on', { ascending: false }) as never)

  const [vendor, setVendor] = useState(''); const [type, setType] = useState(''); const [sev, setSev] = useState(''); const [status, setStatus] = useState('')
  const [sort, setSort] = useState<'date' | 'severity'>('date')
  const [editing, setEditing] = useState<Incident | null>(null)
  const [creating, setCreating] = useState(params.get('new') === '1')
  const [retract, setRetract] = useState<Incident | null>(null)

  const list = useMemo(() => {
    const l = (data ?? []).filter(i =>
      (!vendor || String(i.provider_id) === vendor) && (!type || i.incident_type === type) &&
      (!sev || i.severity === sev) && (!status || i.status === status))
    if (sort === 'severity') l.sort((a, b) => SEV_ORDER[b.severity] - SEV_ORDER[a.severity] || b.occurred_on.localeCompare(a.occurred_on))
    return l
  }, [data, vendor, type, sev, status, sort])

  const counts = useMemo(() => {
    const c: Partial<Record<IncidentStatus, number>> = {}
    for (const i of data ?? []) c[i.status] = (c[i.status] ?? 0) + 1
    return c
  }, [data])

  const closeForm = () => { setCreating(false); setEditing(null); if (params.has('new')) setParams({}, { replace: true }) }

  if (error && !data) {
    return <div className="panel" role="alert"><p>The database isn't responding. It may be waking up after a pause.</p><button className="btn" onClick={retry}>Retry</button></div>
  }

  return (
    <>
      <div className="sec-head">
        <h1>Incidents</h1>
        <button className="btn" onClick={() => setCreating(true)}>Report incident</button>
      </div>
      <p className="muted summary">
        {(Object.keys(STATUS_LABEL) as IncidentStatus[]).filter(s => counts[s]).map(s => `${counts[s]} ${STATUS_LABEL[s].toLowerCase()}`).join(' · ') || ' '}
      </p>
      <section className="panel">
        <div className="filters inc-filters">
          <select aria-label="Vendor" value={vendor} onChange={e => setVendor(e.target.value)}>
            <option value="">All vendors</option>{vendors?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select aria-label="Type" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All types</option>{(Object.keys(TYPE_LABEL) as IncidentType[]).map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          <select aria-label="Severity" value={sev} onChange={e => setSev(e.target.value)}>
            <option value="">All severities</option>{(Object.keys(SEVERITY_LABEL) as Severity[]).map(s => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
          </select>
          <select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses</option>{(Object.keys(STATUS_LABEL) as IncidentStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select aria-label="Sort" value={sort} onChange={e => setSort(e.target.value as 'date' | 'severity')}>
            <option value="date">Newest first</option><option value="severity">Most severe first</option>
          </select>
        </div>
        {loading && !data && <div className="skeleton" style={{ height: 200 }} />}
        {data && list.length === 0 && <p className="muted">No incidents match these filters.</p>}
        {list.map(i => <IncidentItem key={i.id} inc={i} showVendor onEdit={() => setEditing(i)} onRetract={() => setRetract(i)} />)}
      </section>

      <Drawer open={creating || !!editing} title={editing ? 'Edit incident' : 'Report incident'} onClose={closeForm}>
        <IncidentForm key={editing?.id ?? 'new'} vendors={vendors ?? []} initial={editing ?? undefined} onDone={closeForm} />
      </Drawer>
      {retract && (
        <Dialog title="Retract this incident?" confirmLabel="Retract incident" danger onCancel={() => setRetract(null)}
          onConfirm={async () => { await act(supabase.from('incident').delete().eq('id', retract.id), 'Incident retracted'); setRetract(null) }}>
          <p>The vendor's score will be recalculated.</p>
        </Dialog>
      )}
    </>
  )
}
