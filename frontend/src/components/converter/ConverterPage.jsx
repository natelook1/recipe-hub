import { useState, useMemo } from 'react'
import { convert, formatResult, CONVERSIONS, UNIT_GROUPS, GROUP_LABELS, normalizeUnit } from '../../lib/units.js'
import { ArrowLeftRight } from 'lucide-react'

const GROUPS = Object.keys(UNIT_GROUPS)

export default function ConverterPage() {
  const [group, setGroup]   = useState('weight')
  const [from, setFrom]     = useState(UNIT_GROUPS.weight[0])
  const [to, setTo]         = useState(UNIT_GROUPS.weight[1])
  const [input, setInput]   = useState('')

  const units = UNIT_GROUPS[group]

  function switchGroup(g) {
    setGroup(g)
    setFrom(UNIT_GROUPS[g][0])
    setTo(UNIT_GROUPS[g][1])
    setInput('')
  }

  function swap() {
    setFrom(to)
    setTo(from)
  }

  const result = useMemo(() => {
    const n = parseFloat(input)
    if (!input || isNaN(n)) return null
    const r = convert(n, from, to)
    return r != null ? formatResult(r) : null
  }, [input, from, to])

  // Show all-to-all reference table for current group
  const tableUnits = units.slice(0, 8)
  const refInput   = parseFloat(input) || 1

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28">
      {/* Page title */}
      <div className="px-4 pt-5 pb-2">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-text)' }}>
          Unit Converter
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          All cooking &amp; baking units
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none flex-shrink-0">
        {GROUPS.map(g => (
          <button
            key={g}
            onClick={() => switchGroup(g)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0"
            style={group === g
              ? { background: 'var(--color-accent)', color: '#fff' }
              : { background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
          >
            {GROUP_LABELS[g]}
          </button>
        ))}
      </div>

      {/* Converter card */}
      <div className="mx-4 mt-2 rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
        {/* Amount input */}
        <div className="px-4 pt-4 pb-2">
          <label className="label">Amount</label>
          <input
            className="input text-lg font-semibold"
            type="number"
            inputMode="decimal"
            placeholder="Enter amount…"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        </div>

        {/* From / swap / To */}
        <div className="flex items-end gap-2 px-4 pb-4">
          <UnitSelect label="From" value={from} units={units} onChange={v => setFrom(v)} />

          <button
            onClick={swap}
            className="mb-0.5 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-80"
            style={{ background: 'var(--color-surface)', color: 'var(--color-accent)' }}
          >
            <ArrowLeftRight size={16} />
          </button>

          <UnitSelect label="To" value={to} units={units} onChange={v => setTo(v)} />
        </div>

        {/* Result */}
        <div
          className="mx-4 mb-4 rounded-xl px-4 py-3 text-center"
          style={{ background: 'var(--color-surface)' }}
        >
          {result != null ? (
            <>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)', fontFamily: "'Playfair Display', serif" }}>
                {result}
              </div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {CONVERSIONS[normalizeUnit(to)]?.label ?? to}
              </div>
            </>
          ) : (
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {input ? 'Cannot convert between those units' : 'Enter an amount above'}
            </div>
          )}
        </div>
      </div>

      {/* Quick reference table */}
      <div className="mx-4 mt-4">
        <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
          QUICK REFERENCE — {refInput} {CONVERSIONS[normalizeUnit(from)]?.label ?? from}
        </p>
        <div className="rounded-2xl border overflow-hidden divide-y" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', divideColor: 'var(--color-border)' }}>
          {tableUnits.filter(u => u !== from).map(u => {
            const r = convert(refInput, from, u)
            if (r == null) return null
            return (
              <div
                key={u}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors hover:opacity-80"
                style={{ borderColor: 'var(--color-border)' }}
                onClick={() => { setTo(u); setInput(String(refInput)) }}
              >
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {CONVERSIONS[normalizeUnit(u)]?.label ?? u}
                </span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-text)' }}>
                  {formatResult(r)} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{u}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* All units in this group */}
      {units.length > tableUnits.length && (
        <div className="mx-4 mt-3">
          <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
            MORE {GROUP_LABELS[group].toUpperCase()} UNITS
          </p>
          <div className="flex flex-wrap gap-2">
            {units.slice(8).map(u => (
              <button
                key={u}
                onClick={() => setFrom(u)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={from === u
                  ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
                  : { background: 'var(--color-surface)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
              >
                {CONVERSIONS[normalizeUnit(u)]?.label ?? u}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UnitSelect({ label, value, units, onChange }) {
  return (
    <div className="flex-1">
      <label className="label">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input"
        style={{ cursor: 'pointer' }}
      >
        {units.map(u => (
          <option key={u} value={u}>
            {CONVERSIONS[normalizeUnit(u)]?.label ?? u}
          </option>
        ))}
      </select>
    </div>
  )
}
