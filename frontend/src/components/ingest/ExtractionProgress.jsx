import { useState, useEffect } from 'react'

const MESSAGES = [
  { at: 0,    text: 'Fetching recipe…' },
  { at: 4000, text: 'Extracting ingredients…' },
  { at: 9000, text: 'Converting units…' },
  { at: 15000, text: 'Still working — Gemini is busy, retrying…' },
  { at: 22000, text: 'Almost there…' },
  { at: 30000, text: 'Taking longer than usual — hang tight…' },
]

export default function ExtractionProgress() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [elapsed, setElapsed]   = useState(0)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const ms = Date.now() - start
      setElapsed(ms)
      const next = MESSAGES.findLastIndex(m => m.at <= ms)
      if (next !== -1) setMsgIndex(next)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const seconds = Math.floor(elapsed / 1000)

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 px-6 text-center">
      <div
        className="spinner w-10 h-10 rounded-full border-2 border-t-transparent"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
      />
      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {MESSAGES[msgIndex].text}
      </p>
      {seconds >= 5 && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {seconds}s elapsed
        </p>
      )}
    </div>
  )
}
