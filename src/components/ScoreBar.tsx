import type { Tier } from '../lib/types'
import { fmtScore } from '../lib/labels'

/** Number M plus a 64 × 4 capsule bar in the tier colour. */
export default function ScoreBar({ score, tier, align = 'right' }: { score: number; tier: Tier; align?: 'left' | 'right' }) {
  return (
    <span className={`scorebar ${align}`}>
      <span className="num-m">{fmtScore(score)}</span>
      <span className="capsule" aria-hidden="true"><i style={{ width: `${Math.max(2, Math.min(100, score))}%`, background: `var(--${tier})` }} /></span>
    </span>
  )
}
