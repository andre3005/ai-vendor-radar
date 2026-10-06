import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { useAction } from '../hooks/useAction'
import { useRanking } from '../hooks/useQueries'
import type { Incident, IncidentStatus } from '../lib/types'
import { fmtDate, fmtFine, fmtScore, SEVERITY_LABEL, STATUS_LABEL, TYPE_LABEL } from '../lib/labels'
import Sheet from './Sheet'
import IncidentForm from './IncidentForm'

const STEPS: IncidentStatus[] = ['reported', 'under_investigation', 'confirmed', 'fine_imposed', 'appealed', 'annulled']

export default function IncidentSheet({ inc, onClose, onRetract }: { inc: Incident | null; onClose: () => void; onRetract: (i: Incident) => void }) {
  const act = useAction()
  const { data: vendors } = useRanking()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [before, setBefore] = useState<number | null>(null)
  const [last, setLast] = useState<Incident | null>(inc)
  useEffect(() => { if (inc) setLast(inc) }, [inc])
  useEffect(() => { setMode('view'); setBefore(null) }, [inc?.id])

  const i = inc ?? last
  const vendor = vendors?.find(v => v.id === i?.provider_id)
  const step = (s: IncidentStatus) => {
    if (!i || s === i.status) return
    if (vendor) setBefore(vendor.total_score)
    act(supabase.from('incident').update({ status: s }).eq('id', i.id), 'Changes saved')
  }

  return (
    <Sheet open={!!inc} title={mode === 'edit' ? 'Edit incident' : 'Incident'}
      onClose={mode === 'edit' ? () => setMode('view') : onClose}
      cancelLabel={mode === 'edit' ? 'Cancel' : 'Close'}
      action={mode === 'edit' ? { label: 'Save', form: 'sheet-form' } : { label: 'Edit', onClick: () => setMode('edit') }}>
      {i && mode === 'edit' && (
        <IncidentForm vendors={(vendors ?? []).map(v => ({ id: v.id, name: v.name }))} initial={i} onDone={() => setMode('view')} />
      )}
      {i && mode === 'view' && (
        <div>
          <h3 className="title" style={{ fontSize: 24, lineHeight: '28px' }}>{i.title}</h3>
          <p className="callout muted" style={{ marginTop: 4 }}>
            {vendor ? <Link to={`/vendors/${vendor.id}`} onClick={onClose}>{vendor.name}</Link> : i.provider?.name}
            {' '}— {TYPE_LABEL[i.incident_type]}, {SEVERITY_LABEL[i.severity].toLowerCase()} severity, {fmtDate(i.occurred_on)}
          </p>
          {i.description && <p style={{ marginTop: 16 }}>{i.description}</p>}
          {i.fine_amount_eur != null && (
            <p style={{ marginTop: 16 }}><span className="num-m">{fmtFine(i.fine_amount_eur)}</span>
              {i.authority && <span className="callout muted"> imposed by {i.authority}</span>}</p>
          )}

          <h4 className="footnote muted" style={{ marginTop: 24, fontWeight: 500 }}>Status</h4>
          <div className="stepper">
            <div className="track" aria-hidden="true" />
            <ol role="radiogroup" aria-label="Incident status">
              {STEPS.map(s => {
                const idx = STEPS.indexOf(s); const cur = STEPS.indexOf(i.status)
                return (
                  <li key={s}>
                    <button role="radio" aria-checked={s === i.status} onClick={() => step(s)}>
                      <span className={`dot${idx < cur ? ' done' : ''}`}>
                        {s === i.status && <motion.span layoutId="step-thumb" className="thumb" transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} />}
                      </span>
                      <span className="lbl">{STATUS_LABEL[s]}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          {vendor && (
            <div className="impact callout" aria-live="polite">
              {before !== null && before !== vendor.total_score
                ? <>Score impact: {vendor.name} <b>{fmtScore(before)} → {fmtScore(vendor.total_score)}</b></>
                : <>{vendor.name} scores <b>{fmtScore(vendor.total_score)}</b> (incident penalty {fmtScore(vendor.penalty)})</>}
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button className="text-btn danger" onClick={() => onRetract(i)}>Retract incident</button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
