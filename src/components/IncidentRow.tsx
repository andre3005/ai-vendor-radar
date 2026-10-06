import type { Incident } from '../lib/types'
import { fmtDate, fmtFine } from '../lib/labels'
import StatusDot from './StatusDot'

/** One row; the whole row opens the incident sheet. */
export default function IncidentRow({ inc, showVendor, onOpen }: { inc: Incident; showVendor?: boolean; onOpen: () => void }) {
  return (
    <button className="inc-row" onClick={onOpen}>
      <i className={`sev sev-${inc.severity}`} aria-hidden="true" />
      <span className="t">
        <span className="headline">{inc.title}</span>
        <span className="sub callout">
          {showVendor && inc.provider && <span>{inc.provider.name}</span>}
          <span>{fmtDate(inc.occurred_on)}</span>
          <span>{inc.severity[0].toUpperCase() + inc.severity.slice(1)} severity</span>
        </span>
      </span>
      <span className="r">
        <StatusDot status={inc.status} />
        {inc.fine_amount_eur != null && <span className="num-m fine">{fmtFine(inc.fine_amount_eur)}</span>}
      </span>
    </button>
  )
}
