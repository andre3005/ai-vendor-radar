import type { Tier } from '../lib/types'
import { fmtScore } from '../lib/labels'
import { useCountUp } from '../hooks/useCountUp'

/** Large ring for the detail page: 12 px stroke, round caps, number counts on change. */
export default function ScoreRing({ score, tier, size = 180 }: { score: number; tier: Tier; size?: number }) {
  const shown = useCountUp(score)
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fill)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`var(--${tier})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="num-xl">{fmtScore(shown)}</span>
    </span>
  )
}
