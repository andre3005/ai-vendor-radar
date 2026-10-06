import type { Tier } from '../lib/types'
import { TIER_LABEL } from '../lib/labels'

export default function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className="badge" style={{ background: `var(--${tier}-tint)`, color: `var(--${tier}-ink)` }}>
      <span className="dot" style={{ background: `var(--${tier})` }} />
      {TIER_LABEL[tier]}
    </span>
  )
}
