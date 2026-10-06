import type { IncidentStatus } from '../lib/types'
import { STATUS_LABEL } from '../lib/labels'

/** Hollow = unconfirmed, half = in progress, filled = established, strikethrough = annulled. */
export default function StatusDot({ status }: { status: IncidentStatus }) {
  const kind = status === 'reported' ? 'hollow' : status === 'under_investigation' || status === 'appealed' ? 'half' : status === 'annulled' ? 'none' : 'full'
  return (
    <span className={`status status-${status}`}>
      {kind !== 'none' && <i className={`sdot ${kind}`} aria-hidden="true" />}
      <span>{STATUS_LABEL[status]}</span>
    </span>
  )
}
