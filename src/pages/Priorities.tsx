import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { useCriteria, useRanking } from '../hooks/useQueries'
import { useAction } from '../hooks/useAction'
import { useRankMoves } from '../hooks/useRankMoves'
import Drawer from '../components/Drawer'
import ScoreRing from '../components/ScoreRing'
import type { Criterion } from '../lib/types'

const WEIGHT_LABEL = ['Ignore', 'Low', 'Some', 'Medium', 'High', 'Critical']
const BALANCED: Record<string, number> = {
  'Training default': 3, 'Opt-out quality': 2, 'Data retention': 2, 'Data location': 3, 'Policy transparency': 1, 'Certifications & audits': 2,
}
const PRESETS: { name: string; weights: Record<string, number> }[] = [
  { name: 'Balanced (default)', weights: BALANCED },
  { name: 'Regulated bank', weights: { ...BALANCED, 'Data location': 5, 'Certifications & audits': 5 } },
  { name: 'Fast-moving startup', weights: { ...BALANCED, 'Policy transparency': 5, 'Data location': 0, 'Certifications & audits': 0 } },
]

export default function Priorities() {
  const act = useAction()
  const { data: criteria, loading } = useCriteria()
  const { data: vendors } = useRanking()
  const moves = useRankMoves(vendors)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const setWeight = (c: Criterion, w: number) =>
    w !== c.weight && act(supabase.from('criterion').update({ weight: w }).eq('id', c.id), 'Changes saved')

  async function applyPreset(weights: Record<string, number>) {
    const todo = (criteria ?? []).filter(c => weights[c.name] !== undefined && weights[c.name] !== c.weight)
    if (!todo.length) return
    const results = await Promise.all(todo.map(c => supabase.from('criterion').update({ weight: weights[c.name] }).eq('id', c.id)))
    const failed = results.find(r => r.error)
    await act(Promise.resolve({ error: failed?.error ?? null }), 'Changes saved')
  }

  async function addCriterion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setSaving(true)
    const ok = await act(supabase.from('criterion').insert({
      name: String(f.get('name')).trim(), description: String(f.get('description')).trim(), weight: Number(f.get('weight')),
    }), 'Criterion added')
    setSaving(false)
    if (ok) setAdding(false)
  }

  return (
    <>
      <div className="sec-head"><h1>Priorities</h1><button className="btn" onClick={() => setAdding(true)}>Add criterion</button></div>
      <p className="lede">What matters to your company? Weights change the ranking for everyone in this demo.</p>
      <div className="presets" role="group" aria-label="Presets">
        {PRESETS.map(p => <button key={p.name} className="btn secondary" onClick={() => applyPreset(p.weights)}>{p.name}</button>)}
      </div>

      <div className="prio-grid">
        <div className="crit-list">
          {loading && !criteria && <div className="skeleton" style={{ height: 240 }} />}
          {criteria?.map(c => (
            <section key={c.id} className="panel crit">
              <h3>{c.name}</h3>
              <p className="muted">{c.description}</p>
              <div className="seg" role="radiogroup" aria-label={`Weight for ${c.name}`}>
                {WEIGHT_LABEL.map((l, w) => (
                  <button key={w} role="radio" aria-checked={c.weight === w} className={c.weight === w ? 'on' : ''} onClick={() => setWeight(c, w)}>
                    <b>{w}</b><span>{l}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="panel preview" aria-label="Ranking preview">
          <h2>Ranking preview</h2>
          <ul className="rank-list">
            {vendors?.map(v => (
              <motion.li key={v.id} layout transition={{ duration: 0.4 }} className="prev-row">
                <span className="rank-num">{moves[v.id] ? <span style={{ color: `var(--${v.risk_tier}-ink)` }}>{moves[v.id].from > moves[v.id].to ? '↑' : '↓'}{Math.abs(moves[v.id].from - moves[v.id].to)}</span> : v.rank}</span>
                <Link to={`/vendors/${v.id}`}><b>{v.name}</b></Link>
                <ScoreRing score={v.total_score} tier={v.risk_tier} size={40} />
              </motion.li>
            ))}
          </ul>
        </aside>
      </div>

      <Drawer open={adding} title="Add criterion" onClose={() => setAdding(false)}>
        <form className="form" onSubmit={addCriterion}>
          <label>Name<input name="name" required minLength={2} maxLength={60} /></label>
          <label>Description<textarea name="description" required minLength={5} maxLength={300} rows={4} style={{ padding: 12 }} /></label>
          <label>Weight (0–5)<input name="weight" type="number" min={0} max={5} defaultValue={2} required /></label>
          <p className="muted">Every vendor starts with a neutral score of 50 on new criteria.</p>
          <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add criterion'}</button>
        </form>
      </Drawer>
    </>
  )
}
