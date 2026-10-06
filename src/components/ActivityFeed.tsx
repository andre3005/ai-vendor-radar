import { useActivity } from '../hooks/useQueries'
import { useNow } from '../hooks/useNow'
import { fmtRelative } from '../lib/labels'

const ICON: Record<string, string> = { provider: '🏢', incident: '⚠', rating: '★', criterion: '⚖', data_center: '🗄', system: '↺' }

export default function ActivityFeed({ limit = 15 }: { limit?: number }) {
  const { data, loading } = useActivity(limit)
  const now = useNow()
  if (loading && !data) return <div className="skeleton" style={{ height: 160 }} />
  if (!data?.length) return <p className="muted">No activity yet.</p>
  return (
    <ul className="feed">
      {data.map(a => (
        <li key={a.id}>
          <span className="feed-icon" aria-hidden="true">{ICON[a.entity] ?? '•'}</span>
          <span className="feed-msg">{a.message}</span>
          <time className="muted" dateTime={a.occurred_at}>{fmtRelative(a.occurred_at, now)}</time>
        </li>
      ))}
    </ul>
  )
}
