import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, MoreHorizontal } from 'lucide-react'

/** Generic popover: `trigger` gets props to toggle, `children(close)` renders the menu. */
function Popover({ trigger, children, align = 'left' }: {
  trigger: (p: { onClick: () => void; open: boolean }) => ReactNode
  children: (close: () => void) => ReactNode; align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open])
  return (
    <div className="popover" ref={ref}>
      {trigger({ onClick: () => setOpen(o => !o), open })}
      {open && <div className={`menu ${align}`} role="menu">{children(() => setOpen(false))}</div>}
    </div>
  )
}

export interface MenuItem { label: string; onClick: () => void; danger?: boolean }

/** The ⋯ button with a floating action menu. */
export function MoreMenu({ items, label = 'More' }: { items: MenuItem[]; label?: string }) {
  return (
    <Popover align="right" trigger={p => (
      <button type="button" className="icon-btn" aria-label={label} aria-haspopup="menu" aria-expanded={p.open} onClick={p.onClick}>
        <MoreHorizontal size={18} strokeWidth={1.75} />
      </button>
    )}>
      {close => items.map(i => (
        <button key={i.label} role="menuitem" className={`menu-row${i.danger ? ' danger' : ''}`} onClick={() => { close(); i.onClick() }}>{i.label}</button>
      ))}
    </Popover>
  )
}

/** Filter control: a pill that opens a menu of options. Never truncates. */
export function PillMenu<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void
}) {
  const current = options.find(o => o.value === value)
  return (
    <Popover trigger={p => (
      <button type="button" className="pill-btn" aria-haspopup="menu" aria-expanded={p.open} aria-label={label} onClick={p.onClick}>
        <span>{current?.label ?? label}</span><ChevronDown size={14} strokeWidth={2} />
      </button>
    )}>
      {close => options.map(o => (
        <button key={o.value} role="menuitemradio" aria-checked={o.value === value} className="menu-row" onClick={() => { close(); onChange(o.value) }}>
          <span>{o.label}</span>{o.value === value && <Check size={16} strokeWidth={2} />}
        </button>
      ))}
    </Popover>
  )
}
