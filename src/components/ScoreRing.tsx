import type { Tier } from '../lib/types'
import { fmtScore } from '../lib/labels'

export default function ScoreRing({ score, tier, size = 40 }: { score: number; tier: Tier; size?: number }) {
  const stroke = size >= 72 ? 8 : 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--rule)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`var(--${tier})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 500ms var(--ease-out)' }}
        />
      </svg>
      <span className="ring-num" style={{ fontSize: size >= 72 ? size * 0.28 : 11 }}>{fmtScore(score)}</span>
    </span>
  )
}
