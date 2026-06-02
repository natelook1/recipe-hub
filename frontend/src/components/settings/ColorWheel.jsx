import { useRef } from 'react'

export default function ColorWheel({ value, onChange, label }) {
  const inputRef = useRef(null)

  return (
    <button
      onClick={() => inputRef.current?.click()}
      className="flex flex-col items-center gap-2 group"
      title={label}
    >
      {/* Pinwheel ring + swatch */}
      <div className="relative w-16 h-16">
        {/* Conic gradient ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
            padding: 3,
            borderRadius: '50%',
          }}
        >
          {/* Inner mask to make it a ring */}
          <div className="w-full h-full rounded-full" style={{ background: 'var(--color-bg)' }} />
        </div>

        {/* Colour swatch in centre */}
        <div
          className="absolute inset-[5px] rounded-full border-2 border-white/20 shadow-md transition-transform group-hover:scale-110 group-active:scale-95"
          style={{ background: value }}
        />
      </div>

      <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>

      {/* Hidden native colour picker */}
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
      />
    </button>
  )
}
