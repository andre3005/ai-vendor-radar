import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { SEGMENT_LABEL } from '../lib/labels'
import type { Provider, Segment } from '../lib/types'
import { useToast } from './Toast'
import { useDataVersion } from '../hooks/useRealtimeRefresh'

export default function VendorForm({ initial, onDone }: { initial?: Provider; onDone: () => void }) {
  const toast = useToast()
  const { refresh } = useDataVersion()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const year = String(f.get('founded_year') ?? '').trim()
    const row = {
      name: String(f.get('name')).trim(),
      tagline: String(f.get('tagline')).trim() || null,
      hq_city: String(f.get('hq_city')).trim(),
      hq_country: String(f.get('hq_country')).trim(),
      founded_year: year ? Number(year) : null,
      flagship_model: String(f.get('flagship_model')).trim() || null,
      segment: String(f.get('segment')) as Segment,
    }
    setSaving(true); setError(null)
    const { error } = initial
      ? await supabase.from('provider').update(row).eq('id', initial.id)
      : await supabase.from('provider').insert(row)
    setSaving(false)
    if (error) { setError(friendlyError(error)); return }
    toast(initial ? 'Changes saved' : 'Vendor added')
    refresh()
    onDone()
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>Name<input name="name" required minLength={2} maxLength={60} defaultValue={initial?.name} /></label>
      <label>Tagline<input name="tagline" maxLength={120} defaultValue={initial?.tagline ?? ''} /></label>
      <div className="row2">
        <label>HQ city<input name="hq_city" required minLength={2} maxLength={60} defaultValue={initial?.hq_city} /></label>
        <label>HQ country<input name="hq_country" required minLength={2} maxLength={60} defaultValue={initial?.hq_country} /></label>
      </div>
      <div className="row2">
        <label>Founded<input name="founded_year" type="number" min={1990} max={2030} defaultValue={initial?.founded_year ?? ''} /></label>
        <label>Flagship model<input name="flagship_model" maxLength={60} defaultValue={initial?.flagship_model ?? ''} /></label>
      </div>
      <label>Segment
        <select name="segment" defaultValue={initial?.segment ?? 'both'}>
          {(Object.keys(SEGMENT_LABEL) as Segment[]).map(s => <option key={s} value={s}>{SEGMENT_LABEL[s]}</option>)}
        </select>
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add vendor'}</button>
    </form>
  )
}
