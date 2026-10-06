import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useActivity, useRanking } from '../hooks/useQueries'
import { useNow } from '../hooks/useNow'
import RadarScope from '../components/RadarScope'
import ScoreRing from '../components/ScoreRing'
import TierBadge from '../components/TierBadge'
import Monogram from '../components/Monogram'
import ActivityFeed from '../components/ActivityFeed'
import Drawer from '../components/Drawer'
import VendorForm from '../components/VendorForm'
import { fmtRelative, JURISDICTION_LABEL, SEGMENT_LABEL, TIER_LABEL } from '../lib/labels'
import type { Jurisdiction, Segment, Tier } from '../lib/types'

export default function Home() {
  const { data: vendors, loading, error, retry } = useRanking()
  const { data: latest } = useActivity(1)
  const now = useNow()
  const [adding, setAdding] = useState(false)
  const [q, setQ] = useState('')
  const [tier, setTier] = useState<Tier | ''>('')
  const [jur, setJur] = useState<Jurisdiction | ''>('')
  const [seg, setSeg] = useState<Segment | ''>('')

  // Rank movement hints ("↑2") shown for 3 s after a change
  const prev = useRef<Map<number, number>>(new Map())
  const [moves, setMoves] = useState<Record<number, number>>({})
  useEffect(() => {
    if (!vendors) return
    const next: Record<number, number> = {}
    for (const v of vendors) {
      const old = prev.current.get(v.id)
      if (old !== undefined && old !== v.rank) next[v.id] = old - v.rank
    }
    prev.current = new Map(vendors.map(v => [v.id, v.rank]))
    if (Object.keys(next).length) {
      setMoves(next)
      const t = setTimeout(() => setMoves({}), 3000)
      return () => clearTimeout(t)
    }
  }, [vendors])

  const filtered = useMemo(() => (vendors ?? []).filter(v =>
    (!tier || v.risk_tier === tier) &&
    (!seg || v.segment === seg) &&
    (!jur || (v.jurisdictions ?? '').split(',').includes(jur)) &&
    (!q || v.name.toLowerCase().includes(q.toLowerCase())),
  ), [vendors, tier, seg, jur, q])

  const filtersOn = !!(tier || seg || jur || q)
  const clear = () => { setTier(''); setSeg(''); setJur(''); setQ('') }

  if (error && !vendors) {
    return (
      <div className="panel" role="alert">
        <p>The database isn't responding. It may be waking up after a pause.</p>
        <button className="btn" onClick={retry}>Retry</button>
      </div>
    )
  }

  const open = vendors?.reduce((s, v) => s + v.open_incident_count, 0) ?? 0
  const avg = vendors?.length ? vendors.reduce((s, v) => s + v.total_score, 0) / vendors.length : 0

  return (
    <>
      <section className="hero">
        <div className="hero-radar">
          {vendors ? <RadarScope vendors={vendors} /> : <div className="skeleton radar" />}
        </div>
        <div className="hero-text">
          <h1>AI Vendor Risk Radar</h1>
          <p className="lede">Which AI vendors can your company trust with its data?</p>
          <button className="btn" onClick={() => setAdding(true)}>Add vendor</button>
          {vendors && (
            <p className="readout">
              <b>{vendors.length}</b> vendors tracked, <b>{open}</b> open incidents, average score <b>{avg.toFixed(1)}</b>
              {latest?.[0] && <>, last change <b>{fmtRelative(latest[0].occurred_at, now)}</b></>}
            </p>
          )}
        </div>
      </section>

      <div className="home-grid">
        <section className="panel ranking" aria-label="Ranking">
          <div className="filters">
            <input type="search" placeholder="Search vendors" aria-label="Search vendors" value={q} onChange={e => setQ(e.target.value)} />
            <select aria-label="Risk tier" value={tier} onChange={e => setTier(e.target.value as Tier | '')}>
              <option value="">All tiers</option>
              {(Object.keys(TIER_LABEL) as Tier[]).map(t => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
            </select>
            <select aria-label="Jurisdiction" value={jur} onChange={e => setJur(e.target.value as Jurisdiction | '')}>
              <option value="">All jurisdictions</option>
              {(Object.keys(JURISDICTION_LABEL) as Jurisdiction[]).map(j => <option key={j} value={j}>{JURISDICTION_LABEL[j]}</option>)}
            </select>
            <select aria-label="Segment" value={seg} onChange={e => setSeg(e.target.value as Segment | '')}>
              <option value="">All segments</option>
              {(Object.keys(SEGMENT_LABEL) as Segment[]).map(s => <option key={s} value={s}>{SEGMENT_LABEL[s]}</option>)}
            </select>
          </div>

          {loading && !vendors && Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton row-skel" />)}
          {vendors && filtered.length === 0 && (
            <p className="muted">No vendors match these filters. <button className="link" onClick={clear}>Clear filters</button></p>
          )}
          <ul className="rank-list">
            {filtered.map(v => (
              <motion.li key={v.id} layout transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}>
                <Link to={`/vendors/${v.id}`} className="rank-row">
                  <span className="rank-num">
                    {moves[v.id] ? <span style={{ color: `var(--${v.risk_tier}-ink)` }}>{moves[v.id] > 0 ? '↑' : '↓'}{Math.abs(moves[v.id])}</span> : v.rank}
                  </span>
                  <Monogram id={v.id} name={v.name} />
                  <span className="rank-name">
                    <b>{v.name}</b>
                    <span className="muted">{v.hq_country}</span>
                  </span>
                  <ScoreRing score={v.total_score} tier={v.risk_tier} size={48} />
                  <span className="rank-badge"><TierBadge tier={v.risk_tier} /></span>
                  <span className="rank-inc muted">
                    {v.incident_count} incident{v.incident_count === 1 ? '' : 's'}
                    {v.open_incident_count > 0 && <b className="open"> · {v.open_incident_count} open</b>}
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
          {filtersOn && vendors && filtered.length > 0 && <p className="muted">Showing {filtered.length} of {vendors.length}. <button className="link" onClick={clear}>Clear filters</button></p>}
        </section>

        <aside className="panel feed-panel" aria-label="Activity">
          <h2>Activity</h2>
          <ActivityFeed />
        </aside>
      </div>

      <Drawer open={adding} title="Add vendor" onClose={() => setAdding(false)}>
        <VendorForm onDone={() => setAdding(false)} />
      </Drawer>
    </>
  )
}
