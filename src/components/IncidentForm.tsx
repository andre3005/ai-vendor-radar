import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { SEVERITY_LABEL, STATUS_LABEL, TYPE_LABEL } from '../lib/labels'
import type { Incident, IncidentStatus, IncidentType, Severity } from '../lib/types'
import { useAction } from '../hooks/useAction'

const today = () => new Date().toISOString().slice(0, 10)

export default function IncidentForm({ vendors, initial, defaultProviderId, onDone }: {
  vendors: { id: number; name: string }[]; initial?: Incident; defaultProviderId?: number; onDone: () => void
}) {
  const act = useAction()
  const [type, setType] = useState<IncidentType>(initial?.incident_type ?? 'data_breach')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (saving) return
    const f = new FormData(e.currentTarget)
    const fine = String(f.get('fine') ?? '').trim()
    const row = {
      provider_id: Number(f.get('provider_id')),
      title: String(f.get('title')).trim(),
      description: String(f.get('description')).trim() || null,
      incident_type: type,
      severity: String(f.get('severity')),
      status: String(f.get('status')),
      occurred_on: String(f.get('occurred_on')),
      fine_amount_eur: type === 'regulatory_fine' && fine ? Number(fine) : null,
      authority: type === 'regulatory_fine' ? (String(f.get('authority')).trim() || null) : null,
    }
    setSaving(true)
    const ok = await act(
      initial ? supabase.from('incident').update(row).eq('id', initial.id) : supabase.from('incident').insert(row),
      initial ? 'Changes saved' : 'Incident reported',
    )
    setSaving(false)
    if (ok) onDone()
  }

  return (
    <form id="sheet-form" className="form" onSubmit={submit}>
      <label>Vendor
        <select name="provider_id" required defaultValue={initial?.provider_id ?? defaultProviderId ?? ''}>
          <option value="" disabled>Choose a vendor</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>
      <label>Title<input name="title" required minLength={5} maxLength={120} defaultValue={initial?.title} /></label>
      <label>Description<textarea name="description" maxLength={600} rows={4} defaultValue={initial?.description ?? ''} /></label>
      <div className="row2">
        <label>Type
          <select value={type} onChange={e => setType(e.target.value as IncidentType)}>
            {(Object.keys(TYPE_LABEL) as IncidentType[]).map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label>Severity
          <select name="severity" defaultValue={initial?.severity ?? 'medium'}>
            {(Object.keys(SEVERITY_LABEL) as Severity[]).map(s => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
          </select>
        </label>
      </div>
      <div className="row2">
        <label>Status
          <select name="status" defaultValue={initial?.status ?? 'reported'}>
            {(Object.keys(STATUS_LABEL) as IncidentStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label>Date<input name="occurred_on" type="date" required min="2015-01-01" max={today()} defaultValue={initial?.occurred_on ?? today()} /></label>
      </div>
      {type === 'regulatory_fine' && (
        <div className="row2">
          <label>Fine amount (EUR)<input name="fine" type="number" min={0} step="1" defaultValue={initial?.fine_amount_eur ?? ''} /></label>
          <label>Authority<input name="authority" maxLength={80} defaultValue={initial?.authority ?? ''} /></label>
        </div>
      )}
    </form>
  )
}
