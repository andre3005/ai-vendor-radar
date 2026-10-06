import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { useCriteria, useRanking } from '../hooks/useQueries'
import { useAction } from '../hooks/useAction'
import { useRankMoves } from '../hooks/useRankMoves'
import Sheet from '../components/Sheet'
import Segmented from '../components/Segmented'
import ScoreBar from '../components/ScoreBar'
import type { Criterion } from '../lib/types'

const WEIGHT_LABEL = ['Ignore', 'Low', 'Some', 'Medium', 'High', 'Critical']
const BALANCED: Record<string, number> = {
  'Training default': 3, 'Opt-out quality': 2, 'Data retention': 2, 'Data location': 3, 'Policy transparency': 1, 'Certifications & audits': 2,
}
type Preset = 'balanced' | 'bank' | 'startup' | 'custom'
const PRESETS: Record<Exclude<Preset, 'custom'>, Record<string, number>> = {
  balanced: BALANCED,
  bank: { ...BALANCED, 'Data location': 5, 'Certifications & audits': 5 },
  startup: { ...BALANCED, 'Policy transparency': 5, 'Data location': 0, 'Certifications & audits': 0 },
}

export default function Priorities() {
  const act = useAction()
  const { data: criteria, loading } = useCriteria()
  const { data: vendors } = useRanking()
  const moves = useRankMoves(vendors)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const active: Preset = useMemo(() => {
    if (!criteria) return 'balanced'
    for (const k of Object.keys(PRESETS) as Exclude<Preset, 'custom'>[]) {
      if (criteria.every(c => PRESETS[k][c.name] === undefined || PRESETS[k][c.name] === c.weight)) return k
    }
    return 'custom'
  }, [criteria])

  const setWeight = (c: Criterion, w: number) =>
    w !== c.weight && act(supabase.from('criterion').update({ weight: w }).eq('id', c.id), 'Changes saved')

  async function applyPreset(p: Preset) {
    if (p === 'custom') return
    const weights = PRESETS[p]
    const todo = (criteria ?? []).filter(c => weights[c.name] !== undefined && weights[c.name] !== c.weight)
    if (!todo.length) return
    const results = await Promise.all(todo.map(c => supabase.from('criterion').update({ weight: weights[c.name] }).eq('id', c.id)))
    await act(Promise.resolve({ error: results.find(r => r.error)?.error ?? null }), 'Changes saved')
  }

  async function addCriterion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (saving) return
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
      <div className="page-head"><h1 className="large-title">Priorities</h1></div>
      <p className="muted" style={{ maxWidth: '56ch', marginBottom: 24 }}>What matters to your company? Weights change the ranking for everyone in this demo.</p>
      <div className="filters">
        <Segmented label="Presets" value={active} onChange={applyPreset} options={[
          { value: 'balanced', label: 'Balanced' }, { value: 'bank', label: 'Regulated bank' },
          { value: 'startup', label: 'Fast-moving startup' }, { value: 'custom', label: 'Custom' },
        ]} />
      </div>

      <div className="grid-12 prio-grid">
        <div className="main">
          <div className="inset">
            {loading && !criteria && Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton row" />)}
            <ul className="rows">
              {criteria?.map(c => (
                <li key={c.id} className="crit-item">
                  <div><h3 className="headline">{c.name}</h3><p className="callout">{c.description}</p></div>
                  <div className="weight-ctl">
                    <Segmented className="fill" label={`Weight for ${c.name}`} value={c.weight} onChange={w => setWeight(c, w)}
                      options={[0, 1, 2, 3, 4, 5].map(w => ({ value: w, label: String(w) }))} />
                    <span className="footnote">{WEIGHT_LABEL[c.weight]}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: 16 }}><button className="btn secondary" onClick={() => setAdding(true)}>Add criterion</button></div>
        </div>

        <aside className="side" aria-label="Ranking preview">
          <div className="inset">
            <h2 className="headline" style={{ padding: '16px 16px 4px' }}>Ranking preview</h2>
            <ul className="rows" style={{ paddingBottom: 8 }}>
              {vendors?.map(v => {
                const m = moves[v.id]
                return (
                  <motion.li key={v.id} layout transition={{ type: 'spring', stiffness: 400, damping: 35 }} className="prev-row">
                    <span className="r">{m ? <span style={{ color: m.to < m.from ? 'var(--low-text)' : 'var(--high-text)' }}>{m.to < m.from ? '↑' : '↓'}{Math.abs(m.from - m.to)}</span> : v.rank}</span>
                    <Link to={`/vendors/${v.id}`} className="headline" style={{ color: 'var(--label)' }}>{v.name}</Link>
                    <ScoreBar score={v.total_score} tier={v.risk_tier} />
                  </motion.li>
                )
              })}
            </ul>
          </div>
        </aside>
      </div>

      <Sheet open={adding} title="Add criterion" onClose={() => setAdding(false)} action={{ label: 'Save', form: 'sheet-form', disabled: saving }}>
        <form id="sheet-form" className="form" onSubmit={addCriterion}>
          <label>Name<input name="name" required minLength={2} maxLength={60} /></label>
          <label>Description<textarea name="description" required minLength={5} maxLength={300} rows={4} /></label>
          <label>Weight (0–5)<input name="weight" type="number" min={0} max={5} defaultValue={2} required /></label>
          <p className="callout muted">Every vendor starts with a neutral score of 50 on new criteria.</p>
        </form>
      </Sheet>
    </>
  )
}
