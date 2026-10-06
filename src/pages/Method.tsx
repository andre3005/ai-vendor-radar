import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAction } from '../hooks/useAction'

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
    <div className="prose">
      <h1>Method</h1>
      <section className="panel">
        <h2>How the score works</h2>
        <p>Every vendor is rated from 0 to 100 on each data-protection criterion. Your priorities (weights from 0 to 5) decide how much each criterion counts.</p>
        <ul>
          <li><b>Base score</b> = weighted average of the criterion scores.</li>
          <li><b>Incident penalty</b> = for each incident: severity points (low 3, medium 6, high 10, critical 15) × status factor × recency factor, capped at 40.</li>
          <li><b>Status factor</b>: reported 0.3, under investigation 0.5, confirmed 1.0, fine imposed 1.2, appealed 0.8, annulled 0.</li>
          <li><b>Recency factor</b>: 1.0 within the last 24 months, otherwise 0.5.</li>
          <li><b>Total score</b> = base score − penalty, never below 0.</li>
          <li><b>Risk tiers</b>: low risk 75 and above, moderate 60 to 74.9, elevated 45 to 59.9, high risk below 45.</li>
        </ul>
        <p>Why do unconfirmed reports and annulled fines count less? Due process, not headlines: a rumour should not rank a vendor like a proven breach.</p>
      </section>
      <section className="panel">
        <h2>Disclaimer</h2>
        <p>All vendors, incidents, authorities and numbers on this site are fictional. Any resemblance to real companies is coincidental. Criteria inspired by public privacy rankings of AI services.</p>
      </section>
      <section className="panel">
        <h2>About</h2>
        <p>BTMA 631 / BIMA 610, Haskayne School of Business, Group Project 1. Team: [member names].</p>
        <h3>AI-use statement</h3>
        <p>[Team to complete: Claude was used for planning and the database script; Claude Code for implementation. The team tested, reviewed and presented the work.]</p>
      </section>
      <section className="panel">
        <h2>Demo reset</h2>
        <p className="muted">Restores all data to the original state. Needs the reset PIN.</p>
        <form className="form reset" onSubmit={reset}>
          <label>PIN<input type="password" value={pin} onChange={e => setPin(e.target.value)} required autoComplete="off" /></label>
          <button className="btn secondary danger" type="submit" disabled={busy || !pin}>Reset demo data</button>
        </form>
      </section>
    </div>
  )
}
