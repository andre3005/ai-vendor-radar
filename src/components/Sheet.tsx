import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

/** Centred sheet on desktop, bottom sheet on mobile. Header: Cancel · title · primary text action. */
export default function Sheet({ open, title, onClose, action, children, cancelLabel = 'Cancel' }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; cancelLabel?: string
  action?: { label: string; form?: string; onClick?: () => void; disabled?: boolean }
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 733px)').matches

  return (
    <AnimatePresence>
      {open && (
        <div className="sheet-root">
          <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
          <motion.div className="sheet" role="dialog" aria-modal="true" aria-label={title}
            initial={mobile ? { y: '100%' } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={mobile ? { y: '100%' } : { y: 24, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <div className="grabber" />
            <header className="sheet-head">
              <button type="button" className="text-btn" onClick={onClose}>{cancelLabel}</button>
              <h2>{title}</h2>
              {action ? (
                <button type={action.form ? 'submit' : 'button'} form={action.form} className="text-btn strong" onClick={action.onClick} disabled={action.disabled}>{action.label}</button>
              ) : <span />}
            </header>
            <div className="sheet-body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
