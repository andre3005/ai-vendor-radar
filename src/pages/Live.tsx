import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'motion/react'
import { useRanking } from '../hooks/useQueries'
import { useRankMoves } from '../hooks/useRankMoves'
import ActivityFeed from '../components/ActivityFeed'
import ScoreBar from '../components/ScoreBar'
import TierBadge from '../components/TierBadge'
import Monogram from '../components/Monogram'

export default function Live() {
  const { data: vendors } = useRanking()
  const moves = useRankMoves(vendors)
  const url = window.location.origin + window.location.pathname
  const recent = Object.values(moves)

  return (
    <div className="live">
      <Link to="/" className="text-btn" style={{ padding: 0 }}>Exit</Link>
      <div className="grid-12">
        <section className="l" aria-label="Ranking">
          <h1 className="large-title" style={{ marginBottom: 24 }}>AI Vendor Risk Radar</h1>
          <div className="inset">
            <ul className="rows">
              {vendors?.map(v => (
                <motion.li key={v.id} layout transition={{ type: 'spring', stiffness: 400, damping: 35 }} className="live-row">
                  <span className="r">{v.rank}</span>
                  <Monogram name={v.name} size={48} />
                  <span className="nm">{v.name}</span>
                  <TierBadge tier={v.risk_tier} />
                  <ScoreBar score={v.total_score} tier={v.risk_tier} />
                </motion.li>
              ))}
            </ul>
          </div>
        </section>
        <aside className="rr">
          <div className="card" style={{ marginTop: 0 }}>
            <p className="title" style={{ maxWidth: '18ch' }}>Join the demo: report an incident or change a score from your phone</p>
            <div className="qr"><QRCodeSVG value={url} size={280} marginSize={0} /></div>
            <p className="footnote muted" style={{ wordBreak: 'break-all' }}>{url}</p>
            {recent.length > 0 && (
              <div className="move-banner" role="status">
                {recent.map(m => <div key={m.id}>{m.name} {m.to < m.from ? '↑' : '↓'} {m.from} → {m.to}</div>)}
              </div>
            )}
            <h2 className="headline" style={{ margin: '24px 0 4px' }}>Activity</h2>
            <ActivityFeed limit={5} />
          </div>
        </aside>
      </div>
    </div>
  )
}
