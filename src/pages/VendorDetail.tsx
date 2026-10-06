import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { useQuery, useRanking } from '../hooks/useQueries'
import { useAction } from '../hooks/useAction'
import type { DataCenter, Incident, ProviderRanking } from '../lib/types'
import { fmtScore, JURISDICTION_LABEL, SEGMENT_LABEL } from '../lib/labels'
import Monogram from '../components/Monogram'
import ScoreRing from '../components/ScoreRing'
import TierBadge from '../components/TierBadge'
import Sheet from '../components/Sheet'
import Dialog from '../components/Dialog'
import Segmented from '../components/Segmented'
import { MoreMenu } from '../components/Popover'
import VendorForm from '../components/VendorForm'
import IncidentForm from '../components/IncidentForm'
import IncidentRow from '../components/IncidentRow'
import IncidentSheet from '../components/IncidentSheet'
import DataCenterForm from '../components/DataCenterForm'
import DataMap from '../components/DataMap'
import CriterionRow, { type RatingWithCriterion } from '../components/CriterionRow'

type Section = 'criteria' | 'incidents' | 'centers'

/** Axis label wrapped onto two lines so it is never clipped. */
function Tick(props: { x?: number; y?: number; cy?: number; textAnchor?: 'start' | 'middle' | 'end'; payload?: { value: string } }) {
  const { x = 0, y = 0, cy = 0, textAnchor = 'middle', payload } = props
  const words = (payload?.value ?? '').split(' ')
  const mid = words.length > 1 ? Math.ceil(words.length / 2) : 1
  const lines = words.length > 1 ? [words.slice(0, mid).join(' '), words.slice(mid).join(' ')] : words
  // top labels grow upwards, bottom labels start lower, side labels stay centred on the axis end
  const dy = y < cy - 10 ? -(lines.length - 1) * 15 - 4 : y > cy + 10 ? 14 : -(lines.length - 1) * 7
  return (
    <text x={x} y={y + dy} textAnchor={textAnchor} fontSize="13" fill="#6E6E73" style={{ letterSpacing: 0 }}>
      {lines.map((l, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : 15}>{l}</tspan>)}
    </text>
  )
}

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

  const [section, setSection] = useState<Section>('criteria')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [sheet, setSheet] = useState<'edit' | 'incident' | 'dc' | null>(null)
  const [openInc, setOpenInc] = useState<number | null>(null)
  const [retract, setRetract] = useState<Incident | null>(null)
  const [removeVendor, setRemoveVendor] = useState(false)

  if (error && !vendor) {
    return <div className="card" role="alert" style={{ marginTop: 32 }}><p>The database isn't responding. It may be waking up after a pause.</p><button className="btn" style={{ marginTop: 16 }} onClick={retry}>Retry</button></div>
  }
  if (loading && !vendor) return <div className="skeleton" style={{ height: 320, marginTop: 32 }} />
  if (!vendor) return <div className="card" style={{ marginTop: 32 }}><h1 className="title">Vendor not found</h1><Link to="/">Back to the radar</Link></div>

  const sorted = [...(ratings ?? [])].sort((a, b) => a.criterion.sort_order - b.criterion.sort_order)
  const chart = sorted.map(r => ({ name: r.criterion.name, score: r.score }))
  const currentInc = incidents?.find(i => i.id === openInc) ?? null

  return (
    <>
      <Link to="/" className="back"><ChevronLeft size={18} strokeWidth={2} />Vendors</Link>
      <header className="vhead">
        <Monogram name={vendor.name} size={56} />
        <div>
          <h1 className="large-title">{vendor.name}</h1>
          {vendor.tagline && <p className="muted" style={{ marginTop: 4 }}>{vendor.tagline}</p>}
          <div className="facts callout">
            <span><b>Headquarters</b>{vendor.hq_city}, {vendor.hq_country}</span>
            {vendor.founded_year && <span><b>Founded</b>{vendor.founded_year}</span>}
            {vendor.flagship_model && <span><b>Flagship</b>{vendor.flagship_model}</span>}
            <span><b>Segment</b>{SEGMENT_LABEL[vendor.segment]}</span>
          </div>
        </div>
        <MoreMenu label="Vendor actions" items={[
          { label: 'Edit vendor', onClick: () => setSheet('edit') },
          { label: 'Remove vendor', danger: true, onClick: () => setRemoveVendor(true) },
        ]} />
      </header>

      <div className="grid-12 detail-top">
        <section className="card ring-card" aria-label="Score">
          <ScoreRing score={vendor.total_score} tier={vendor.risk_tier} />
          <TierBadge tier={vendor.risk_tier} />
          <p className="callout muted">#{vendor.rank} of {all?.length ?? '…'} vendors</p>
        </section>
        <section className="card eq-card" aria-label="How the score is built">
          <h2 className="headline">How the score is built</h2>
          <div className="eq">
            <div><span className="num-m">{fmtScore(vendor.base_score)}</span><span className="footnote">Base score</span></div>
            <span className="op" aria-hidden="true">−</span>
            <div><span className="num-m">{fmtScore(vendor.penalty)}</span><span className="footnote">Incident penalty</span></div>
            <span className="op" aria-hidden="true">=</span>
            <div><span className="num-m">{fmtScore(vendor.total_score)}</span><span className="footnote">Total</span></div>
          </div>
          <p className="callout" style={{ marginTop: 24 }}><Link to="/method">How is this calculated?</Link></p>
        </section>
      </div>

      <div className="sections">
        <Segmented className="big" label="Section" value={section} onChange={setSection} options={[
          { value: 'criteria', label: 'Criteria' },
          { value: 'incidents', label: `Incidents (${incidents?.length ?? 0})` },
          { value: 'centers', label: `Data centers (${centers?.length ?? 0})` },
        ]} />

        {section === 'criteria' && (
          <div className="grid-12 crit-grid">
            <div className="chart-col" aria-hidden="true">
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chart} outerRadius="56%" margin={{ top: 32, right: 56, bottom: 32, left: 56 }}>
                    <PolarGrid stroke="rgba(0,0,0,0.12)" />
                    <PolarAngleAxis dataKey="name" tick={<Tick />} />
                    <Radar dataKey="score" stroke="#0071E3" strokeWidth={2} fill="#0071E3" fillOpacity={0.14} dot={{ r: 4, fill: '#0071E3' }} isAnimationActive={false} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="list-col">
              <div className="inset">
                <ul className="rows">
                  {sorted.map(r => (
                    <li key={r.criterion.id}>
                      <CriterionRow providerId={id} r={r} expanded={expanded === r.criterion.id}
                        onToggle={() => setExpanded(e => (e === r.criterion.id ? null : r.criterion.id))} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {section === 'incidents' && (
          <div style={{ marginTop: 24 }}>
            <div className="sec-head">
              <h2 className="title">Incidents</h2>
              <button className="btn secondary small" onClick={() => setSheet('incident')}>Report incident</button>
            </div>
            <div className="inset">
              {incidents && incidents.length === 0 && <div className="empty">No incidents on record for {vendor.name}.</div>}
              <ul className="rows">{incidents?.map(i => <li key={i.id}><IncidentRow inc={i} onOpen={() => setOpenInc(i.id)} /></li>)}</ul>
            </div>
          </div>
        )}

        {section === 'centers' && (
          <div className="grid-12 map-grid">
            <div className="map-col">
              {centers && centers.length > 0 ? <div className="map"><DataMap centers={centers} vendorName={vendor.name} /></div> : <div className="card empty">No data centers on record.</div>}
            </div>
            <div className="dc-col">
              <div className="sec-head" style={{ marginBottom: 12 }}>
                <h2 className="headline">Regions</h2>
                <button className="btn secondary small" onClick={() => setSheet('dc')}>Add data center</button>
              </div>
              <div className="inset">
                <ul className="rows">
                  {centers?.map(c => (
                    <li key={c.id} className="dc-row">
                      <div><span className="headline">{c.city}</span><span className="callout">{c.country}</span></div>
                      <div className="meta"><span className="chip" title={JURISDICTION_LABEL[c.jurisdiction]}>{c.jurisdiction}</span><span className="purpose">{c.purpose}</span></div>
                      <MoreMenu label={`${c.city} actions`} items={[{ label: 'Close region', danger: true, onClick: () => act(supabase.from('data_center').delete().eq('id', c.id), 'Region closed') }]} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <Sheet open={sheet === 'edit'} title="Edit vendor" onClose={() => setSheet(null)} action={{ label: 'Save', form: 'sheet-form' }}>
        <VendorForm initial={vendor} onDone={() => setSheet(null)} />
      </Sheet>
      <Sheet open={sheet === 'incident'} title="Report incident" onClose={() => setSheet(null)} action={{ label: 'Save', form: 'sheet-form' }}>
        <IncidentForm vendors={[{ id: vendor.id, name: vendor.name }]} defaultProviderId={vendor.id} onDone={() => setSheet(null)} />
      </Sheet>
      <Sheet open={sheet === 'dc'} title="Add data center" onClose={() => setSheet(null)} action={{ label: 'Save', form: 'sheet-form' }}>
        <DataCenterForm providerId={vendor.id} onDone={() => setSheet(null)} />
      </Sheet>
      <IncidentSheet inc={currentInc} onClose={() => setOpenInc(null)} onRetract={setRetract} />

      {retract && (
        <Dialog title="Retract this incident?" confirmLabel="Retract incident" danger onCancel={() => setRetract(null)}
          onConfirm={async () => { await act(supabase.from('incident').delete().eq('id', retract.id), 'Incident retracted'); setRetract(null); setOpenInc(null) }}>
          The vendor's score will be recalculated.
        </Dialog>
      )}
      {removeVendor && (
        <Dialog title={`Remove ${vendor.name}?`} confirmLabel="Remove vendor" danger onCancel={() => setRemoveVendor(false)}
          onConfirm={async () => {
            const ok = await act(supabase.from('provider').delete().eq('id', vendor.id), 'Vendor removed')
            if (ok) nav('/')
          }}>
          This also removes {incidents?.length ?? 0} incident{incidents?.length === 1 ? '' : 's'}, {centers?.length ?? 0} data center{centers?.length === 1 ? '' : 's'} and {ratings?.length ?? 0} ratings.
        </Dialog>
      )}
    </>
  )
}
