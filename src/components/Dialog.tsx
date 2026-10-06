import { useEffect, type ReactNode } from 'react'

export default function Dialog({ title, children, confirmLabel, danger, busy, onConfirm, onCancel }: {
  title: string; children: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean
  onConfirm: () => void; onCancel: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])
  return (
    <div className="sheet-root center" style={{ zIndex: 120 }}>
      <div className="backdrop" onClick={onCancel} />
      <div className="alert" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2 className="headline" style={{ fontSize: 20, lineHeight: '26px' }}>{title}</h2>
        <div className="callout muted" style={{ marginTop: 8, fontSize: 17, lineHeight: '24px' }}>{children}</div>
        <div className="dialog-actions">
          <button className="btn secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn${danger ? ' destructive' : ''}`} onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
