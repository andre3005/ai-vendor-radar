import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { JURISDICTION_LABEL } from '../lib/labels'
import { CITY_PRESETS } from '../lib/cities'
import type { Jurisdiction, Purpose } from '../lib/types'
import { useAction } from '../hooks/useAction'

const PURPOSES: Purpose[] = ['training', 'inference', 'storage', 'backup']

export default function DataCenterForm({ providerId, onDone }: { providerId: number; onDone: () => void }) {
  const act = useAction()
  const [saving, setSaving] = useState(false)
  const [v, setV] = useState({ city: '', country: '', jurisdiction: 'US' as Jurisdiction, lat: '', lng: '' })

  function preset(i: string) {
    if (i === '') return
    const p = CITY_PRESETS[Number(i)]
    setV({ city: p.city, country: p.country, jurisdiction: p.jurisdiction, lat: String(p.lat), lng: String(p.lng) })
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (saving) return
    const f = new FormData(e.currentTarget)
    setSaving(true)
    const ok = await act(supabase.from('data_center').insert({
      provider_id: providerId, city: v.city.trim(), country: v.country.trim(), jurisdiction: v.jurisdiction,
      purpose: String(f.get('purpose')), latitude: Number(v.lat), longitude: Number(v.lng),
    }), 'Data center added')
    setSaving(false)
    if (ok) onDone()
  }

  return (
    <form id="sheet-form" className="form" onSubmit={submit}>
      <label>Preset city
        <select defaultValue="" onChange={e => preset(e.target.value)}>
          <option value="">Custom</option>
          {CITY_PRESETS.map((p, i) => <option key={p.city} value={i}>{p.city}, {p.country}</option>)}
        </select>
      </label>
      <div className="row2">
        <label>City<input required minLength={2} maxLength={60} value={v.city} onChange={e => setV({ ...v, city: e.target.value })} /></label>
        <label>Country<input required minLength={2} maxLength={60} value={v.country} onChange={e => setV({ ...v, country: e.target.value })} /></label>
      </div>
      <div className="row2">
        <label>Jurisdiction
          <select value={v.jurisdiction} onChange={e => setV({ ...v, jurisdiction: e.target.value as Jurisdiction })}>
            {(Object.keys(JURISDICTION_LABEL) as Jurisdiction[]).map(j => <option key={j} value={j}>{JURISDICTION_LABEL[j]}</option>)}
          </select>
        </label>
        <label>Purpose
          <select name="purpose" defaultValue="inference">{PURPOSES.map(p => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}</select>
        </label>
      </div>
      <div className="row2">
        <label>Latitude<input required type="number" step="any" min={-90} max={90} value={v.lat} onChange={e => setV({ ...v, lat: e.target.value })} /></label>
        <label>Longitude<input required type="number" step="any" min={-180} max={180} value={v.lng} onChange={e => setV({ ...v, lng: e.target.value })} /></label>
      </div>
    </form>
  )
}
