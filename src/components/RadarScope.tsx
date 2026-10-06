import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProviderRanking } from '../lib/types'
import { fmtScore, TIER_LABEL } from '../lib/labels'

const SIZE = 600
const C = SIZE / 2
const R = 255
const SWEEP_SECONDS = 6
const GOLDEN = 137.508

const BANDS = [
  { max: 100, fill: 'var(--low-tint)' },
  { max: 75, fill: 'var(--moderate-tint)' },
  { max: 60, fill: 'var(--elevated-tint)' },
  { max: 45, fill: 'var(--high-tint)' },
]

/** Angle is fixed per vendor id, so a score change moves a blip only along its radius. */
export function blipAngle(id: number) {
  return (id * GOLDEN) % 360
}

export default function RadarScope({ vendors }: { vendors: ProviderRanking[] }) {
  const nav = useNavigate()
  const [active, setActive] = useState<number | null>(null)
  const wedge = (() => {
    const a = (-50 * Math.PI) / 180
    return `M ${C} ${C} L ${C + R} ${C} A ${R} ${R} 0 0 0 ${C + R * Math.cos(a)} ${C + R * Math.sin(a)} Z`
  })()

  return (
    <svg className="radar" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-labelledby="radar-title">
      <title id="radar-title">Radar of AI vendors. The closer a vendor is to the centre, the higher its risk. The ranking list below has the same information.</title>
      <defs>
        <linearGradient id="sweep-grad" x1="1" y1="0" x2="0.2" y2="0.8">
          <stop offset="0" stopColor="var(--signal)" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="var(--sweep-teal)" stopOpacity="0.1" />
          <stop offset="1" stopColor="var(--sweep-teal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {BANDS.map(b => <circle key={b.max} cx={C} cy={C} r={(b.max / 100) * R} fill={b.fill} fillOpacity="0.6" stroke="var(--rule)" />)}
      <g className="sweep" style={{ transformOrigin: `${C}px ${C}px`, animationDuration: `${SWEEP_SECONDS}s` }}>
        <path d={wedge} fill="url(#sweep-grad)" />
      </g>
      <g fontSize="12" fill="var(--slate)" fontFamily="var(--font-ui)">
        <text x={C + 4} y={C - (R * 0.375)} dy="-2">High risk</text>
        <text x={C + 4} y={C - (R * 0.525)} dy="-2">Elevated</text>
        <text x={C + 4} y={C - (R * 0.675)} dy="-2">Moderate</text>
        <text x={C + 4} y={C - (R * 0.875)} dy="-2">Low risk</text>
        <text x={C} y={C + 4} textAnchor="middle" fontSize="13">your data</text>
      </g>
      {vendors.map(v => {
        const ang = blipAngle(v.id)
        const rad = (ang * Math.PI) / 180
        const rr = (v.total_score / 100) * R
        const x = C + rr * Math.cos(rad)
        const y = C + rr * Math.sin(rad)
        const delay = (ang / 360) * SWEEP_SECONDS
        const label = `${v.name}, score ${fmtScore(v.total_score)}, ${TIER_LABEL[v.risk_tier].toLowerCase()}`
        const flip = Math.cos(rad) < 0
        return (
          <g
            key={v.id} className="blip" tabIndex={0} role="button" aria-label={label}
            style={{ transform: `translate(${x}px, ${y}px)` }}
            onClick={() => nav(`/vendors/${v.id}`)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nav(`/vendors/${v.id}`) } }}
            onMouseEnter={() => setActive(v.id)} onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(v.id)} onBlur={() => setActive(null)}
          >
            <g style={{ animationDelay: `${delay}s` }} className="blip-inner">
              <circle className="blip-pulse" r="5" fill="none" stroke={`var(--${v.risk_tier})`} style={{ animationDelay: `${delay}s` }} />
              <circle r="14" fill="transparent" />
              <circle r="7" fill={`var(--${v.risk_tier})`} stroke="var(--surface)" strokeWidth="2" className="blip-dot" style={{ animationDelay: `${delay}s` }} />
              <text className={`blip-name${active === v.id ? ' show' : ''}`} x={flip ? -12 : 12} y="4" textAnchor={flip ? 'end' : 'start'}
                fontSize="13" fill="var(--ink)" stroke="var(--surface)" strokeWidth="3" paintOrder="stroke">{v.name}</text>
            </g>
          </g>
        )
      })}
      {active !== null && (() => {
        const v = vendors.find(x => x.id === active)
        if (!v) return null
        return (
          <text x={C} y={SIZE - 16} textAnchor="middle" fontSize="14" fill="var(--ink)" fontWeight="600">
            {v.name}: {fmtScore(v.total_score)} · {TIER_LABEL[v.risk_tier]}
          </text>
        )
      })()}
    </svg>
  )
}
