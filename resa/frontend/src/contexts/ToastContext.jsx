import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

let idSeq = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'info') => {
      const id = ++idSeq
      setToasts((current) => [...current, { id, message, type }])
      setTimeout(() => remove(id), 4000)
    },
    [remove],
  )

  const value = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }

  const styles = {
    success: 'border-ok-400/40 text-ok-400',
    error: 'border-alert-500/40 text-alert-400',
    info: 'border-ink-600 text-fog-200',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-80 max-w-[90vw] flex-col gap-2">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            onClick={() => remove(toast.id)}
            className={`reveal flex items-start gap-2 rounded-lg border bg-ink-850/95 px-4 py-3 text-left text-sm font-medium shadow-xl backdrop-blur-md transition hover:bg-ink-800 ${styles[toast.type]}`}
          >
            <span className="mt-0.5 font-mono text-xs opacity-70">▸</span>
            <span>{toast.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
