import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { useQuery, useRanking } from '../hooks/useQueries'
import { useAction } from '../hooks/useAction'
import type { DataCenter, Incident, ProviderRanking } from '../lib/types'
import { fmtScore, JURISDICTION_LABEL, SEGMENT_LABEL } from '../lib/labels'
import Monogram from '../components/Monogram'
import ScoreRing from '../components/ScoreRing'
import TierBadge from '../components/TierBadge'
import Drawer from '../components/Drawer'
import Dialog from '../components/Dialog'
import VendorForm from '../components/VendorForm'
import IncidentForm from '../components/IncidentForm'
import IncidentItem from '../components/IncidentItem'
import DataCenterForm from '../components/DataCenterForm'
import DataMap from '../components/DataMap'
import RatingRow, { type RatingWithCriterion } from '../components/RatingRow'

export default function VendorDetail() {
  const id = Number(useParams().id)
  const nav = useNavigate()
  const act = useAction()
  const { data: all } = useRanking()
  const { data: vendor, loading, error, retry } = useQuery<ProviderRanking>(
    () => supabase.from('provider_ranking').select('*').eq('id', id).maybeSingle(), [id])
  const { data: ratings } = useQuery<RatingWithCriterion[]>(() => supabase.from('rating')
    .select('score, note, updated_at, criterion:criterion_id(id, name, description, weight, sort_order)').eq('provider_id', id) as never, [id])
  const { data: incidents } = useQuery<Incident[]>(() => supabase.from('incident')
    .select('*, provider:provider_id(id, name)').eq('provider_id', id).order('occurred_on', { ascending: false }) as never, [id])
  const { data: centers } = useQuery<DataCenter[]>(() => supabase.from('data_center').select('*').eq('provider_id', id).order('id') as never, [id])

  const [drawer, setDrawer] = useState<'edit' | 'incident' | 'dc' | null>(null)
  const [editInc, setEditInc] = useState<Incident | null>(null)
  const [retract, setRetract] = useState<Incident | null>(null)
  const [removeVendor, setRemoveVendor] = useState(false)

  if (error && !vendor) {
    return <div className="panel" role="alert"><p>The database isn't responding. It may be waking up after a pause.</p><button className="btn" onClick={retry}>Retry</button></div>
  }
  if (loading && !vendor) return <div className="skeleton" style={{ height: 300 }} />
  if (!vendor) return <div className="panel"><h1>Vendor not found</h1><Link to="/">Back to the radar</Link></div>

  const sorted = [...(ratings ?? [])].sort((a, b) => a.criterion.sort_order - b.criterion.sort_order)
  const chart = sorted.map(r => ({ name: r.criterion.name, score: r.score }))

  return (
    <>
      <p><Link to="/">← All vendors</Link></p>
      <header className="vhead">
        <Monogram id={vendor.id} name={vendor.name} size={56} />
        <div className="vhead-text">
          <h1>{vendor.name}</h1>
          <p className="muted">
            {vendor.tagline && <>{vendor.tagline}<br /></>}
            {vendor.hq_city}, {vendor.hq_country}
            {vendor.founded_year && <> · founded {vendor.founded_year}</>}
            {vendor.flagship_model && <> · {vendor.flagship_model}</>} · {SEGMENT_LABEL[vendor.segment]}
          </p>
        </div>
        <div className="vhead-actions">
          <button className="btn secondary" onClick={() => setDrawer('edit')}>Edit</button>
          <button className="btn secondary danger" onClick={() => setRemoveVendor(true)}>Remove vendor</button>
        </div>
      </header>

      <div className="detail-grid">
        <section className="panel scorecard" aria-label="Score">
          <ScoreRing score={vendor.total_score} tier={vendor.risk_tier} size={160} />
          <TierBadge tier={vendor.risk_tier} />
          <p><b>#{vendor.rank}</b> of {all?.length ?? '…'}</p>
          <p className="muted">Base {fmtScore(vendor.base_score)} − incident penalty {fmtScore(vendor.penalty)} = <b>{fmtScore(vendor.total_score)}</b></p>
          <Link to="/method">How is this calculated?</Link>
        </section>

        <section className="panel" aria-label="Criteria">
          <h2>Criteria</h2>
          <div className="criteria">
            <div className="chart" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chart} outerRadius="58%" margin={{ left: 56, right: 56 }}>
                  <PolarGrid stroke="var(--rule)" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#536670' }} />
                  <Radar dataKey="score" stroke="#2F6BFF" strokeWidth={2} fill="#2F6BFF" fillOpacity={0.18} dot={{ r: 4, fill: '#2F6BFF' }} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <ul className="ratings">
              {sorted.map(r => <RatingRow key={r.criterion.id} providerId={id} r={r} />)}
            </ul>
          </div>
        </section>
      </div>

      <div className="detail-grid2">
        <section className="panel" aria-label="Incidents">
          <div className="sec-head">
            <h2>Incidents</h2>
            <button className="btn" onClick={() => { setEditInc(null); setDrawer('incident') }}>Report incident</button>
          </div>
          {incidents && incidents.length === 0 && <p className="muted">No incidents on record for {vendor.name}.</p>}
          {incidents?.map(i => (
            <IncidentItem key={i.id} inc={i} onEdit={() => { setEditInc(i); setDrawer('incident') }} onRetract={() => setRetract(i)} />
          ))}
        </section>

        <section className="panel" aria-label="Data centers">
          <div className="sec-head">
            <h2>Data centers</h2>
            <button className="btn" onClick={() => setDrawer('dc')}>Add data center</button>
          </div>
          {centers && centers.length > 0 ? <DataMap centers={centers} vendorName={vendor.name} /> : <p className="muted">No data centers on record.</p>}
          <ul className="dc-list">
            {centers?.map(c => (
              <li key={c.id}>
                <span><b>{c.city}</b>, {c.country}<br />
                  <span className="muted">{c.jurisdiction} · {JURISDICTION_LABEL[c.jurisdiction]} · {c.purpose}</span></span>
                <button className="btn secondary small danger" onClick={() => act(supabase.from('data_center').delete().eq('id', c.id), 'Region closed')}>Close region</button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Drawer open={drawer === 'edit'} title="Edit vendor" onClose={() => setDrawer(null)}>
        <VendorForm initial={vendor} onDone={() => setDrawer(null)} />
      </Drawer>
      <Drawer open={drawer === 'incident'} title={editInc ? 'Edit incident' : 'Report incident'} onClose={() => setDrawer(null)}>
        <IncidentForm key={editInc?.id ?? 'new'} vendors={[{ id: vendor.id, name: vendor.name }]} initial={editInc ?? undefined} defaultProviderId={vendor.id} onDone={() => setDrawer(null)} />
      </Drawer>
      <Drawer open={drawer === 'dc'} title="Add data center" onClose={() => setDrawer(null)}>
        <DataCenterForm providerId={vendor.id} onDone={() => setDrawer(null)} />
      </Drawer>

      {retract && (
        <Dialog title="Retract this incident?" confirmLabel="Retract incident" danger onCancel={() => setRetract(null)}
          onConfirm={async () => { await act(supabase.from('incident').delete().eq('id', retract.id), 'Incident retracted'); setRetract(null) }}>
          <p>The vendor's score will be recalculated.</p>
        </Dialog>
      )}
      {removeVendor && (
        <Dialog title={`Remove ${vendor.name}?`} confirmLabel="Remove vendor" danger onCancel={() => setRemoveVendor(false)}
          onConfirm={async () => {
            const ok = await act(supabase.from('provider').delete().eq('id', vendor.id), 'Vendor removed')
            if (ok) nav('/')
          }}>
          <p>This also removes {incidents?.length ?? 0} incident{incidents?.length === 1 ? '' : 's'}, {centers?.length ?? 0} data center{centers?.length === 1 ? '' : 's'} and {ratings?.length ?? 0} ratings.</p>
        </Dialog>
      )}
    </>
  )
}
