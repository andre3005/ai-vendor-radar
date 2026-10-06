import { Link } from 'react-router-dom'
import type { Incident } from '../lib/types'
import { fmtDate, fmtFine, TYPE_LABEL } from '../lib/labels'
import SeverityBars from './SeverityBars'
import StatusPill from './StatusPill'

export default function IncidentItem({ inc, showVendor, onEdit, onRetract }: {
  inc: Incident; showVendor?: boolean; onEdit: () => void; onRetract: () => void
}) {
  return (
    <article className="incident">
      <header>
        <SeverityBars severity={inc.severity} />
        <b>{inc.title}</b>
      </header>
      <p className="muted meta">
        {showVendor && inc.provider && <><Link to={`/vendors/${inc.provider.id}`}>{inc.provider.name}</Link> · </>}
        {TYPE_LABEL[inc.incident_type]} · {fmtDate(inc.occurred_on)}
        {inc.fine_amount_eur != null && <> · {fmtFine(inc.fine_amount_eur)}{inc.authority ? ` (${inc.authority})` : ''}</>}
      </p>
      {inc.description && <p className="desc">{inc.description}</p>}
      <div className="inc-actions">
        <StatusPill id={inc.id} status={inc.status} />
        <button className="btn secondary small" onClick={onEdit}>Edit</button>
        <button className="btn secondary small danger" onClick={onRetract}>Retract incident</button>
      </div>
    </article>
  )
}
