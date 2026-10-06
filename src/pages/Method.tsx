import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAction } from '../hooks/useAction'

const FACTORS = [
  ['Base score', 'Weighted average of the criterion scores. Your priorities (weights 0 to 5) decide how much each criterion counts.'],
  ['Severity points', 'Low 3, medium 6, high 10, critical 15, for each incident.'],
  ['Status factor', 'Reported 0.3, under investigation 0.5, confirmed 1.0, fine imposed 1.2, appealed 0.8, annulled 0.'],
  ['Recency factor', '1.0 within the last 24 months, otherwise 0.5.'],
  ['Incident penalty', 'Sum of severity × status × recency over all incidents, capped at 40.'],
  ['Total score', 'Base score minus the penalty, never below 0.'],
  ['Risk tiers', 'Low risk 75 and above, moderate 60 to 74.9, elevated 45 to 59.9, high risk below 45.'],
]

export default function Method() {
  const act = useAction()
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)

  async function reset(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const ok = await act(supabase.rpc('reset_demo', { p_pin: pin }), 'Demo data restored')
    setBusy(false)
    if (ok) setPin('')
  }

  return (
    <div className="grid-12 prose-grid prose">
      <div>
        <div className="page-head" style={{ marginBottom: 0 }}><h1 className="large-title">Method</h1></div>
        <section>
          <h2 className="title">How the score works</h2>
          <p style={{ marginTop: 12 }}>Every vendor is rated from 0 to 100 on each data-protection criterion. Incidents then reduce the score, depending on how serious they are and how well established.</p>
          <div className="inset" style={{ marginTop: 16 }}>
            <ul className="rows">{FACTORS.map(([t, d]) => <li key={t} className="factor"><span className="headline">{t}</span><span className="callout">{d}</span></li>)}</ul>
          </div>
          <p style={{ marginTop: 16 }}>Why do unconfirmed reports and annulled fines count less? Due process, not headlines: a rumour should not rank a vendor like a proven breach.</p>
        </section>
        <section>
          <h2 className="title">Disclaimer</h2>
          <p style={{ marginTop: 12 }}>All vendors, incidents, authorities and numbers on this site are fictional. Any resemblance to real companies is coincidental. Criteria inspired by public privacy rankings of AI services.</p>
        </section>
        <section>
          <h2 className="title">About</h2>
          <p style={{ marginTop: 12 }}>BTMA 631 / BIMA 610, Haskayne School of Business, Group Project 1. Team: [member names].</p>
          <h3 className="headline" style={{ marginTop: 16 }}>AI-use statement</h3>
          <p className="muted" style={{ marginTop: 4 }}>[Team to complete: Claude was used for planning and the database script; Claude Code for implementation. The team tested, reviewed and presented the work.]</p>
        </section>
        <section className="card">
          <h2 className="headline">Demo reset</h2>
          <p className="callout muted" style={{ marginTop: 4 }}>Restores all data to the original state. Needs the reset PIN.</p>
          <form className="form" style={{ marginTop: 16, maxWidth: 320 }} onSubmit={reset}>
            <label>PIN<input type="password" value={pin} onChange={e => setPin(e.target.value)} required autoComplete="off" /></label>
            <div><button className="btn secondary" type="submit" disabled={busy || !pin}>Reset demo data</button></div>
          </form>
        </section>
      </div>
    </div>
  )
}
