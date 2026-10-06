import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export default function Drawer({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="drawer" role="dialog" aria-modal="true" aria-label={title}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="drawer-head">
              <h2>{title}</h2>
              <button className="btn secondary" onClick={onClose} aria-label="Close">Close</button>
            </div>
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
