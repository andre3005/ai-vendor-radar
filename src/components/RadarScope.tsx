import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProviderRanking } from '../lib/types'
import { fmtScore, TIER_LABEL } from '../lib/labels'

const SWEEP_SECONDS = 8
const GOLDEN = 137.508

/** Angle is fixed per vendor id, so a score change moves a blip only along its radius. */
export function blipAngle(id: number) {
  return (id * GOLDEN) % 360
}

interface Placed { x: number; y: number; w: number; side: 1 | -1 }

export default function RadarScope({ vendors }: { vendors: ProviderRanking[] }) {
  const nav = useNavigate()
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(520)
  const [active, setActive] = useState<number | null>(null)
  const prev = useRef<Map<number, number>>(new Map())
  const [pulses, setPulses] = useState<Record<number, number>>({})

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize(Math.round(el.clientWidth)))
    ro.observe(el); setSize(Math.round(el.clientWidth))
    return () => ro.disconnect()
  }, [])

  // one expanding ring when a vendor's score changes
  useEffect(() => {
    const changed: Record<number, number> = {}
    for (const v of vendors) {
      const old = prev.current.get(v.id)
      if (old !== undefined && old !== v.total_score) changed[v.id] = Date.now()
    }
    prev.current = new Map(vendors.map(v => [v.id, v.total_score]))
    if (Object.keys(changed).length) setPulses(p => ({ ...p, ...changed }))
  }, [vendors])

  const small = size < 420
  const C = size / 2
  const R = C - (small ? 8 : 12)

  const blips = useMemo(() => {
    const placed: Placed[] = []
    return vendors.map(v => {
      const ang = blipAngle(v.id)
      const rad = (ang * Math.PI) / 180
      const rr = (v.total_score / 100) * R
      const x = C + rr * Math.cos(rad)
      const y = C + rr * Math.sin(rad)
      const w = v.name.length * 7 + 8
      const overlaps = (side: 1 | -1) => {
        const x0 = side === 1 ? x + 12 : x - 12 - w
        return placed.some(p => {
          const px0 = p.side === 1 ? p.x + 12 : p.x - 12 - p.w
          return Math.abs(p.y - y) < 16 && x0 < px0 + p.w && px0 < x0 + w
        })
      }
      let side: 1 | -1 = Math.cos(rad) >= 0 ? 1 : -1
      if (overlaps(side)) side = (side === 1 ? -1 : 1)
      placed.push({ x, y, w, side })
      return { v, ang, x, y, side }
    })
  }, [vendors, R, C])

  const rings = [{ p: 0.45, t: 'High risk' }, { p: 0.6, t: 'Elevated' }, { p: 0.75, t: 'Moderate' }, { p: 1, t: 'Low risk' }]
  const act = vendors.find(v => v.id === active)

  return (
    <div>
      <div className="radar-box" ref={box} style={{ height: size }}>
        <div className="sweep" style={{ inset: C - R, animationDuration: `${SWEEP_SECONDS}s` }} />
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-labelledby="radar-title">
          <title id="radar-title">Radar of AI vendors. The closer a vendor is to the centre, the higher its risk. The ranking list below has the same information.</title>
          <defs>
            <radialGradient id="core" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="var(--high-tint)" stopOpacity="1" />
              <stop offset="1" stopColor="var(--high-tint)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={C} cy={C} r={R * 0.45} fill="url(#core)" />
          {rings.map(r => <circle key={r.p} cx={C} cy={C} r={R * r.p} fill="none" stroke="var(--separator-strong)" strokeWidth="1" />)}
          {!small && rings.map(r => (
            <text key={r.t} x={C} y={C - R * r.p + 16} textAnchor="middle"
              fontSize="12" fontWeight="500" fill="var(--label-2)" stroke="#F5F5F7" strokeWidth="4" paintOrder="stroke">{r.t}</text>
          ))}
          <circle cx={C} cy={C} r="3" fill="var(--label)" />
          <text x={C} y={C + 20} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--label)" stroke="#fff" strokeWidth="4" paintOrder="stroke">Your data</text>

          {blips.map(({ v, ang, x, y, side }) => {
            const delay = (ang / 360) * SWEEP_SECONDS
            const label = `${v.name}, score ${fmtScore(v.total_score)}, ${TIER_LABEL[v.risk_tier].toLowerCase()}`
            const go = () => nav(`/vendors/${v.id}`)
            return (
              <g key={v.id} className="blip" tabIndex={0} role="button" aria-label={label}
                style={{ transform: `translate(${x}px, ${y}px)` }}
                onClick={() => (small ? setActive(a => (a === v.id ? null : v.id)) : go())}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } }}
                onMouseEnter={() => setActive(v.id)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(v.id)} onBlur={() => setActive(null)}>
                {pulses[v.id] && <circle key={pulses[v.id]} className="blip-ring" r="6" fill="none" stroke={`var(--${v.risk_tier})`} strokeWidth="2" />}
                <circle r="16" fill="transparent" />
                <g className="blip-flash" style={{ animationDelay: `${delay}s` }}>
                  <circle className="blip-dot" r="7.5" fill={`var(--${v.risk_tier})`} stroke="#fff" strokeWidth="3" />
                </g>
                {!small && (
                  <text x={side * 14} y="4.5" textAnchor={side === 1 ? 'start' : 'end'} fontSize="13" fontWeight="500" fill="var(--label)"
                    stroke="#fff" strokeWidth="4" paintOrder="stroke" style={{ pointerEvents: 'none' }}>{v.name}</text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      {small && <p className="radar-callout callout" aria-live="polite">{act ? `${act.name}: ${fmtScore(act.total_score)}, ${TIER_LABEL[act.risk_tier]}` : 'Tap a vendor'}</p>}
    </div>
  )
}
