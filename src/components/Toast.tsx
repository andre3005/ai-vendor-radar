import { Check } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

const ToastCtx = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null)
  const show = useCallback((text: string) => {
    const id = Date.now()
    setMsg({ id, text })
    setTimeout(() => setMsg(m => (m?.id === id ? null : m)), 3000)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {msg && <div className="toast" key={msg.id}><Check size={16} strokeWidth={2.25} />{msg.text}</div>}
      </div>
    </ToastCtx.Provider>
  )
}
