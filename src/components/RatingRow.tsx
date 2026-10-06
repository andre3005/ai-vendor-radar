import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAction } from '../hooks/useAction'

export interface RatingWithCriterion {
  score: number; note: string | null
  criterion: { id: number; name: string; description: string; weight: number; sort_order: number }
}

export default function RatingRow({ providerId, r }: { providerId: number; r: RatingWithCriterion }) {
  const act = useAction()
  const [score, setScore] = useState(r.score)
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(r.note ?? '')
  useEffect(() => setScore(r.score), [r.score])
  useEffect(() => setNote(r.note ?? ''), [r.note])

  const key = { provider_id: providerId, criterion_id: r.criterion.id }
  const commitScore = () => {
    if (score !== r.score) act(supabase.from('rating').update({ score }).match(key), 'Changes saved')
  }
  const commitNote = () => {
    setEditing(false)
    const n = note.trim()
    if (n !== (r.note ?? '')) act(supabase.from('rating').update({ note: n || null }).match(key), 'Changes saved')
  }

  return (
    <li className="rating">
      <div className="rating-head">
        <b>{r.criterion.name}</b>
        <span className="weight" title={`Weight ${r.criterion.weight} of 5`} aria-label={`Weight ${r.criterion.weight} of 5`}>
          {[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= r.criterion.weight ? 'on' : ''} />)}
        </span>
        <span className="score-num">{score}</span>
      </div>
      <input type="range" min={0} max={100} value={score} aria-label={`${r.criterion.name} score`}
        onChange={e => setScore(Number(e.target.value))}
        onPointerUp={commitScore} onKeyUp={commitScore} onBlur={commitScore} />
      {editing ? (
        <input autoFocus maxLength={280} value={note} aria-label="Note" onChange={e => setNote(e.target.value)}
          onBlur={commitNote} onKeyDown={e => { if (e.key === 'Enter') commitNote() }} />
      ) : (
        <button className="link note" onClick={() => setEditing(true)}>{r.note || 'Add a note'}</button>
      )}
    </li>
  )
}
