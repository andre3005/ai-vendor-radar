import { initials, MONOGRAM_BG } from '../lib/labels'

export default function Monogram({ id, name, size = 40 }: { id: number; name: string; size?: number }) {
  return (
    <span className="mono" style={{ width: size, height: size, background: MONOGRAM_BG[id % MONOGRAM_BG.length] }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
