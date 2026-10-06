import { useId } from 'react'
import { motion } from 'motion/react'

export interface SegOption<T> { value: T; label: string }

/** iOS-style segmented control with a sliding white thumb. */
export default function Segmented<T extends string | number>({ options, value, onChange, label, className = '' }: {
  options: SegOption<T>[]; value: T; onChange: (v: T) => void; label: string; className?: string
}) {
  const id = useId()
  return (
    <div className={`segmented ${className}`} role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value}
          className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.value === value && (
            <motion.span layoutId={`seg-${id}`} className="seg-thumb" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />
          )}
          <span className="seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
