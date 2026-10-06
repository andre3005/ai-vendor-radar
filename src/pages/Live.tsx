import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'motion/react'
import { useRanking } from '../hooks/useQueries'
import { useRankMoves } from '../hooks/useRankMoves'
import ActivityFeed from '../components/ActivityFeed'
import ScoreRing from '../components/ScoreRing'
import TierBadge from '../components/TierBadge'
import Monogram from '../components/Monogram'

export default function Live() {
  const { data: vendors } = useRanking()
  const moves = useRankMoves(vendors)
  const url = window.location.origin + window.location.pathname
  const recent = Object.values(moves)

  return (
    <div className="live">
      <Link to="/" className="back">← Back</Link>
      <div className="live-grid">
        <section aria-label="Ranking">
          <h1>AI Vendor Risk Radar</h1>
          <ul className="rank-list live-list">
            {vendors?.map(v => (
              <motion.li key={v.id} layout transition={{ duration: 0.5 }} className="live-row">
                <span className="live-rank">{v.rank}</span>
                <Monogram id={v.id} name={v.name} size={48} />
                <b className="live-name">{v.name}</b>
                <TierBadge tier={v.risk_tier} />
                <ScoreRing score={v.total_score} tier={v.risk_tier} size={72} />
              </motion.li>
            ))}
          </ul>
        </section>
        <aside>
          <p className="join">Join the demo: report an incident or change a score from your phone</p>
          <div className="qr"><QRCodeSVG value={url} size={240} marginSize={2} /></div>
          <p className="muted">{url}</p>
          {recent.length > 0 && (
            <div className="move-banner" role="status">
              {recent.map(m => <div key={m.id}>{m.name} {m.to < m.from ? '↑' : '↓'} {m.from} → {m.to}</div>)}
            </div>
          )}
          <h2>Activity</h2>
          <ActivityFeed limit={8} />
        </aside>
      </div>
    </div>
  )
}
