import type { Severity } from '../lib/types'
import { SEVERITY_LABEL } from '../lib/labels'

const LEVEL: Record<Severity, { n: number; tier: string }> = {
  low: { n: 1, tier: 'low' }, medium: { n: 2, tier: 'moderate' }, high: { n: 3, tier: 'elevated' }, critical: { n: 4, tier: 'high' },
}

export default function SeverityBars({ severity }: { severity: Severity }) {
  const { n, tier } = LEVEL[severity]
  return (
    <span className="sev" title={`${SEVERITY_LABEL[severity]} severity`}>
      {[1, 2, 3, 4].map(i => (
        <i key={i} style={{ height: 4 + i * 3, background: i <= n ? `var(--${tier})` : 'var(--rule)' }} />
      ))}
      <span className="sr">{SEVERITY_LABEL[severity]} severity</span>
    </span>
  )
}
