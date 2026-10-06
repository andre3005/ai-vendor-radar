import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useActivity, useRanking } from '../hooks/useQueries'
import { useRankMoves } from '../hooks/useRankMoves'
import RadarScope from '../components/RadarScope'
import ScoreBar from '../components/ScoreBar'
import TierBadge from '../components/TierBadge'
import Monogram from '../components/Monogram'
import ActivityFeed from '../components/ActivityFeed'
import Sheet from '../components/Sheet'
import Segmented from '../components/Segmented'
import { PillMenu } from '../components/Popover'
import VendorForm from '../components/VendorForm'
import { JURISDICTION_LABEL, SEGMENT_LABEL } from '../lib/labels'
import type { Jurisdiction, Segment, Tier } from '../lib/types'

const TIERS: { value: Tier | ''; label: string }[] = [
  { value: '', label: 'All' }, { value: 'low', label: 'Low' }, { value: 'moderate', label: 'Moderate' },
  { value: 'elevated', label: 'Elevated' }, { value: 'high', label: 'High' },
]

export default function Home() {
  const { data: vendors, loading, error, retry } = useRanking()
  useActivity(1)
  const moves = useRankMoves(vendors)
  const [adding, setAdding] = useState(false)
  const [q, setQ] = useState('')
  const [tier, setTier] = useState<Tier | ''>('')
  const [jur, setJur] = useState<Jurisdiction | ''>('')
  const [seg, setSeg] = useState<Segment | ''>('')

  const filtered = useMemo(() => (vendors ?? []).filter(v =>
    (!tier || v.risk_tier === tier) && (!seg || v.segment === seg) &&
    (!jur || (v.jurisdictions ?? '').split(',').includes(jur)) &&
    (!q || v.name.toLowerCase().includes(q.toLowerCase())),
  ), [vendors, tier, seg, jur, q])
  const clear = () => { setTier(''); setSeg(''); setJur(''); setQ('') }

  if (error && !vendors) {
    return (
      <div className="card" role="alert" style={{ marginTop: 32 }}>
        <p>The database isn't responding. It may be waking up after a pause.</p>
        <button className="btn" style={{ marginTop: 16 }} onClick={retry}>Retry</button>
      </div>
    )
  }

  const open = vendors?.reduce((s, v) => s + v.open_incident_count, 0) ?? 0
  const avg = vendors?.length ? vendors.reduce((s, v) => s + v.total_score, 0) / vendors.length : 0

  return (
    <>
      <section className="hero">
        <h1 className="hero-title">AI Vendor Risk Radar</h1>
        <p className="lede">Which AI vendors can your company trust with its data?</p>
        <div className="radar-wrap">
          {vendors ? <RadarScope vendors={vendors} /> : <div className="skeleton" style={{ aspectRatio: '1', borderRadius: '50%' }} />}
        </div>
        {vendors && (
          <div className="stats">
            <div className="stat"><span className="num-m">{vendors.length}</span><span className="footnote">vendors</span></div>
            <div className="stat"><span className="num-m">{open}</span><span className="footnote">open incidents</span></div>
            <div className="stat"><span className="num-m">{avg.toFixed(1)}</span><span className="footnote">average score</span></div>
          </div>
        )}
      </section>

      <section className="section" aria-label="Vendors">
        <div className="sec-head">
          <h2 className="title">Vendors</h2>
          <button className="btn secondary small" onClick={() => setAdding(true)}>Add vendor</button>
        </div>
        <div className="filters">
          <Segmented label="Risk tier" options={TIERS} value={tier} onChange={setTier} />
          <PillMenu label="Jurisdiction" value={jur} onChange={setJur}
            options={[{ value: '', label: 'All jurisdictions' }, ...(Object.keys(JURISDICTION_LABEL) as Jurisdiction[]).map(j => ({ value: j, label: JURISDICTION_LABEL[j] }))]} />
          <PillMenu label="Segment" value={seg} onChange={setSeg}
            options={[{ value: '', label: 'All segments' }, ...(Object.keys(SEGMENT_LABEL) as Segment[]).map(s => ({ value: s, label: SEGMENT_LABEL[s] }))]} />
          <input type="search" placeholder="Search" aria-label="Search vendors" value={q} onChange={e => setQ(e.target.value)} />
        </div>

        <div className="grid-12 home-grid">
          <div className="list-col">
            <div className="inset">
              <div className="rank-head footnote" aria-hidden="true">
                <span /><span /><span>Vendor</span><span>Regions</span><span className="o">Open</span><span>Risk</span><span className="s">Score</span>
              </div>
              {loading && !vendors && Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton row" />)}
              {vendors && filtered.length === 0 && (
                <div className="empty"><p>No vendors match these filters.</p><button className="link" onClick={clear}>Clear filters</button></div>
              )}
              <ul className="rows">
                {filtered.map(v => {
                  const m = moves[v.id]
                  return (
                    <motion.li key={v.id} layout transition={{ type: 'spring', stiffness: 400, damping: 35 }}>
                      <Link to={`/vendors/${v.id}`} className="rank-row">
                        <span className="r">
                          {m ? <span className="rank-delta" style={{ color: m.to < m.from ? 'var(--low-text)' : 'var(--high-text)' }}>{m.to < m.from ? '↑' : '↓'}{Math.abs(m.from - m.to)}</span> : v.rank}
                        </span>
                        <span className="m"><Monogram name={v.name} /></span>
                        <span className="n"><span className="headline">{v.name}</span><span className="callout">{v.hq_country}</span></span>
                        <span className="j">{(v.jurisdictions ?? '').split(',').filter(Boolean).map(j => <span key={j} className="chip">{j}</span>)}</span>
                        <span className="o" style={{ color: v.open_incident_count ? 'var(--high-text)' : 'var(--label-3)' }}>{v.open_incident_count || '—'}</span>
                        <span className="b"><TierBadge tier={v.risk_tier} /></span>
                        <span className="s"><ScoreBar score={v.total_score} tier={v.risk_tier} /></span>
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>
            </div>
          </div>
          <aside className="act-col" aria-label="Activity">
            <div className="inset act-card">
              <h3 className="headline act-title">Activity</h3>
              <div className="act-scroll"><ActivityFeed /></div>
            </div>
          </aside>
        </div>
      </section>

      <Sheet open={adding} title="Add vendor" onClose={() => setAdding(false)} action={{ label: 'Save', form: 'sheet-form' }}>
        <VendorForm onDone={() => setAdding(false)} />
      </Sheet>
    </>
  )
}
