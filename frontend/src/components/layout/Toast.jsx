import { useState, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

let _show = null
export function showToast(message, type = 'success') {
  _show?.(message, type)
}

export function ToastContainer() {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  _show = useCallback((message, type) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type, out: false })
    timerRef.current = setTimeout(() => {
      setToast(t => t ? { ...t, out: true } : null)
      setTimeout(() => setToast(null), 280)
    }, 3000)
  }, [])

  if (!toast) return null

  const Icon = toast.type === 'error' ? XCircle : CheckCircle
  const color = toast.type === 'error' ? 'bg-red-600' : 'bg-[#4a7c59]'

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 ${toast.out ? 'toast-out' : 'toast-in'}`}>
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${color}`}>
        <Icon size={16} />
        <span>{toast.message}</span>
        <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
