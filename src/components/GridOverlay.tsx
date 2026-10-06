import { useSearchParams } from 'react-router-dom'

/** Alignment debug: add ?grid to the URL. */
export default function GridOverlay() {
  const [p] = useSearchParams()
  if (!p.has('grid')) return null
  return (
    <div className="grid-overlay" aria-hidden="true">
      <div className="container grid-12">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
    </div>
  )
}
