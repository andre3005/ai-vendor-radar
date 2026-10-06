import { Building2, ShieldAlert, SlidersHorizontal, Scale, Server, RotateCcw, Circle } from 'lucide-react'
import { useActivity } from '../hooks/useQueries'
import { useNow } from '../hooks/useNow'
import { fmtRelative } from '../lib/labels'

const ICON: Record<string, typeof Circle> = { provider: Building2, incident: ShieldAlert, rating: SlidersHorizontal, criterion: Scale, data_center: Server, system: RotateCcw }

export default function ActivityFeed({ limit = 15 }: { limit?: number }) {
  const { data, loading } = useActivity(limit)
  const now = useNow()
  if (loading && !data) return <div className="skeleton" style={{ height: 160 }} />
  if (!data?.length) return <p className="callout muted">No activity yet.</p>
  return (
    <ul className="feed">
      {data.map(a => {
        const Icon = ICON[a.entity] ?? Circle
        return (
          <li key={a.id}>
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            <span className="callout">{a.message}</span>
            <time className="footnote" dateTime={a.occurred_at}>{fmtRelative(a.occurred_at, now)}</time>
          </li>
        )
      })}
    </ul>
  )
}
