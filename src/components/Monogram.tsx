/** Squircle with the first two letters of the vendor's first word. */
export default function Monogram({ name, size = 40 }: { id?: number; name: string; size?: number }) {
  const w = name.trim().split(/\s+/)[0] ?? ''
  const txt = w.charAt(0).toUpperCase() + w.charAt(1).toLowerCase()
  return <span className="mono" style={{ width: size, height: size, fontSize: size >= 48 ? 20 : 15, borderRadius: Math.round(size * 0.275) }} aria-hidden="true">{txt}</span>
}
