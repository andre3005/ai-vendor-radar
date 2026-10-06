import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAction } from '../hooks/useAction'

export interface RatingWithCriterion {
  score: number; note: string | null
  criterion: { id: number; name: string; description: string; weight: number; sort_order: number }
}

/** Collapsed: name, weight, score. Expanded: slider and note. */
export default function CriterionRow({ providerId, r, expanded, onToggle }: {
  providerId: number; r: RatingWithCriterion; expanded: boolean; onToggle: () => void
}) {
  const act = useAction()
  const [score, setScore] = useState(r.score)
  const [note, setNote] = useState(r.note ?? '')
  useEffect(() => setScore(r.score), [r.score])
  useEffect(() => setNote(r.note ?? ''), [r.note])
  const key = { provider_id: providerId, criterion_id: r.criterion.id }

  const commitScore = () => { if (score !== r.score) act(supabase.from('rating').update({ score }).match(key), 'Changes saved') }
  const commitNote = () => {
    const n = note.trim()
    if (n !== (r.note ?? '')) act(supabase.from('rating').update({ note: n || null }).match(key), 'Changes saved')
  }

  return (
    <div>
      <button className="crit-row" onClick={onToggle} aria-expanded={expanded}>
        <span className="top">
          <span>
            <span className="headline">{r.criterion.name}</span>
            <span className="footnote">Weight {r.criterion.weight}{r.note && !expanded ? ` — ${r.note}` : ''}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="num-m">{score}</span>
            <ChevronDown size={18} strokeWidth={1.75} color="var(--label-3)" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .3s var(--ease-out)' }} />
          </span>
        </span>
      </button>
      {expanded && (
        <div className="crit-edit">
          <input type="range" min={0} max={100} value={score} aria-label={`${r.criterion.name} score`}
            onChange={e => setScore(Number(e.target.value))} onPointerUp={commitScore} onKeyUp={commitScore} onBlur={commitScore} />
          <input maxLength={280} value={note} placeholder="Note" aria-label="Note" onChange={e => setNote(e.target.value)}
            onBlur={commitNote} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
        </div>
      )}
    </div>
  )
}
