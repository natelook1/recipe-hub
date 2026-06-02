import { useState, useMemo } from 'react'
import { convert, formatResult, CONVERSIONS, UNIT_GROUPS, GROUP_LABELS, normalizeUnit } from '../../lib/units.js'
import { convertWithDensity, INGREDIENT_LIST, DENSITIES } from '../../lib/densities.js'
import { ArrowLeftRight, Scale, FlaskConical, Search } from 'lucide-react'

// ── Unit groups for the pure-unit tabs ────────────────────────────────────────
const PURE_GROUPS = Object.keys(UNIT_GROUPS)
const ALL_GROUPS  = ['ingredient', ...PURE_GROUPS]
const ALL_LABELS  = { ingredient: 'By Ingredient', ...GROUP_LABELS }

// ── Canonical unit lists for the ingredient tab ───────────────────────────────
const WEIGHT_UNITS  = ['g', 'kg', 'oz', 'lb']
const VOLUME_UNITS  = ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz', 'pt', 'qt']

function unitLabel(u) { return CONVERSIONS[normalizeUnit(u)]?.label ?? u }

// ─────────────────────────────────────────────────────────────────────────────

export default function ConverterPage() {
  const [group, setGroup]           = useState('ingredient')

  // Ingredient tab state
  const [ingredient, setIngredient] = useState('all-purpose flour')
  const [ingSearch, setIngSearch]   = useState('')
  const [activeSystem, setActive]   = useState('weight')   // 'weight' | 'volume'
  const [weightUnit, setWeightUnit] = useState('g')
  const [volumeUnit, setVolumeUnit] = useState('cup')
  const [amount, setAmount]         = useState('')

  // Pure-unit tab state
  const [from, setFrom]             = useState(UNIT_GROUPS.weight[0])
  const [to, setTo]                 = useState(UNIT_GROUPS.weight[1])
  const [pureInput, setPureInput]   = useState('')

  function switchGroup(g) {
    setGroup(g)
    if (PURE_GROUPS.includes(g)) {
      setFrom(UNIT_GROUPS[g][0])
      setTo(UNIT_GROUPS[g][1])
      setPureInput('')
    }
  }

  // ── Ingredient tab: derive both sides from whichever is active ───────────────
  const ingResult = useMemo(() => {
    const n = parseFloat(amount)
    if (!amount || isNaN(n)) return null

    if (activeSystem === 'weight') {
      // weight → volume
      const r = convertWithDensity(n, weightUnit, volumeUnit, ingredient)
      return r ? { weight: { value: n, unit: weightUnit }, volume: { value: r.amount, unit: r.unit } } : null
    } else {
      // volume → weight
      const r = convertWithDensity(n, volumeUnit, weightUnit, ingredient)
      return r ? { volume: { value: n, unit: volumeUnit }, weight: { value: r.amount, unit: r.unit } } : null
    }
  }, [amount, activeSystem, weightUnit, volumeUnit, ingredient])

  // ── Pure-unit tab result ─────────────────────────────────────────────────────
  const pureResult = useMemo(() => {
    const n = parseFloat(pureInput)
    if (!pureInput || isNaN(n)) return null
    const r = convert(n, from, to)
    return r != null ? formatResult(r) : null
  }, [pureInput, from, to])

  // ── Ingredient search ────────────────────────────────────────────────────────
  const filteredIngredients = useMemo(() => {
    const q = ingSearch.toLowerCase().trim()
    if (!q) return INGREDIENT_LIST
    return INGREDIENT_LIST.filter(i => i.includes(q))
  }, [ingSearch])

  const byCategory = useMemo(() => {
    const groups = {}
    for (const name of filteredIngredients) {
      const cat = DENSITIES[name].category
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(name)
    }
    return groups
  }, [filteredIngredients])

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28">
      {/* Header */}
      <div className="px-4 pt-5 pb-2">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-text)' }}>
          Unit Converter
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Weight vs volume by ingredient, or convert any unit
        </p>
      </div>

      {/* Tab strip */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none flex-shrink-0">
        {ALL_GROUPS.map(g => (
          <button
            key={g}
            onClick={() => switchGroup(g)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0"
            style={group === g
              ? { background: 'var(--color-accent)', color: '#fff' }
              : { background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
          >
            {ALL_LABELS[g]}
          </button>
        ))}
      </div>

      {/* ── INGREDIENT TAB ──────────────────────────────────────────────────── */}
      {group === 'ingredient' && (
        <div className="flex flex-col gap-3 px-4 mt-1">

          {/* Ingredient picker */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  className="input pl-8 text-sm"
                  placeholder="Search ingredient (e.g. butter, flour, honey)…"
                  value={ingSearch}
                  onChange={e => setIngSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-44 overflow-y-auto">
              {Object.entries(byCategory).map(([cat, names]) => (
                <div key={cat}>
                  <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wide sticky top-0" style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
                    {cat}
                  </div>
                  {names.map(name => (
                    <button
                      key={name}
                      onClick={() => { setIngredient(name); setIngSearch('') }}
                      className="w-full text-left px-4 py-2 text-sm transition-colors"
                      style={{
                        background: ingredient === name ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent',
                        color: ingredient === name ? 'var(--color-accent)' : 'var(--color-text)',
                        fontWeight: ingredient === name ? 600 : 400,
                      }}
                    >
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}
              </span>
              {' '}— {DENSITIES[ingredient]?.gPerCup}g per cup · {(DENSITIES[ingredient]?.gPerCup / 236.588).toFixed(3)} g/ml
            </div>
          </div>

          {/* System toggle + input */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            {/* Weight / Volume system toggle */}
            <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
              <SystemTab
                active={activeSystem === 'weight'}
                icon={<Scale size={14} />}
                label="Enter weight"
                onClick={() => { setActive('weight'); setAmount('') }}
              />
              <SystemTab
                active={activeSystem === 'volume'}
                icon={<FlaskConical size={14} />}
                label="Enter volume"
                onClick={() => { setActive('volume'); setAmount('') }}
              />
            </div>

            {/* Input row */}
            <div className="flex items-end gap-2 px-4 py-4">
              <div className="flex-1">
                <label className="label">{activeSystem === 'weight' ? 'Weight' : 'Volume'}</label>
                <input
                  className="input text-lg font-semibold"
                  type="number"
                  inputMode="decimal"
                  placeholder="Amount…"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="w-32 flex-shrink-0">
                <label className="label">Unit</label>
                <select
                  className="input"
                  value={activeSystem === 'weight' ? weightUnit : volumeUnit}
                  onChange={e => activeSystem === 'weight' ? setWeightUnit(e.target.value) : setVolumeUnit(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {(activeSystem === 'weight' ? WEIGHT_UNITS : VOLUME_UNITS).map(u => (
                    <option key={u} value={u}>{unitLabel(u)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Result — the OTHER system */}
            {ingResult ? (
              <div className="mx-4 mb-4 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                {/* Weight side */}
                <ResultRow
                  icon={<Scale size={14} />}
                  system="Weight"
                  value={ingResult.weight.value}
                  unit={ingResult.weight.unit}
                  active={activeSystem === 'weight'}
                  unitOptions={WEIGHT_UNITS}
                  selectedUnit={weightUnit}
                  onUnitChange={setWeightUnit}
                />
                <div style={{ height: 1, background: 'var(--color-border)' }} />
                {/* Volume side */}
                <ResultRow
                  icon={<FlaskConical size={14} />}
                  system="Volume"
                  value={ingResult.volume.value}
                  unit={ingResult.volume.unit}
                  active={activeSystem === 'volume'}
                  unitOptions={VOLUME_UNITS}
                  selectedUnit={volumeUnit}
                  onUnitChange={setVolumeUnit}
                />
              </div>
            ) : (
              <div className="mx-4 mb-4 rounded-xl px-4 py-4 text-center text-sm" style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
                Enter an amount above to convert
              </div>
            )}
          </div>

          {/* Reference table: 1 cup / 100g in all units */}
          {ingResult && (
            <div>
              <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
                QUICK REFERENCE — {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}
              </p>
              <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
                {[
                  { label: '1 cup', from: 1, fromUnit: 'cup' },
                  { label: '1 tbsp', from: 1, fromUnit: 'tbsp' },
                  { label: '1 tsp', from: 1, fromUnit: 'tsp' },
                  { label: '100g', from: 100, fromUnit: 'g' },
                  { label: '1 oz', from: 1, fromUnit: 'oz' },
                ].map(({ label, from: f, fromUnit: fu }) => {
                  const toG  = convertWithDensity(f, fu, 'g', ingredient)
                  const toCup = convertWithDensity(f, fu, 'cup', ingredient)
                  const toMl  = convertWithDensity(f, fu, 'ml', ingredient)
                  const toOz  = convertWithDensity(f, fu, 'oz', ingredient)
                  return (
                    <div key={label} className="flex items-center px-4 py-2.5 border-b text-sm" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="w-16 font-semibold flex-shrink-0" style={{ color: 'var(--color-accent)' }}>{label}</span>
                      <div className="flex gap-3 flex-wrap" style={{ color: 'var(--color-text-muted)' }}>
                        {toG   && fu !== 'g'   && <span><b style={{ color: 'var(--color-text)' }}>{formatResult(toG.amount)}</b>g</span>}
                        {toOz  && fu !== 'oz'  && <span><b style={{ color: 'var(--color-text)' }}>{formatResult(toOz.amount)}</b>oz</span>}
                        {toCup && fu !== 'cup' && <span><b style={{ color: 'var(--color-text)' }}>{formatResult(toCup.amount)}</b> cup</span>}
                        {toMl  && fu !== 'ml'  && <span><b style={{ color: 'var(--color-text)' }}>{formatResult(toMl.amount)}</b>ml</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PURE UNIT TABS ──────────────────────────────────────────────────── */}
      {group !== 'ingredient' && (
        <div className="flex flex-col gap-3 px-4 mt-1">
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            <div className="px-4 pt-4 pb-2">
              <label className="label">Amount</label>
              <input
                className="input text-lg font-semibold"
                type="number"
                inputMode="decimal"
                placeholder="Enter amount…"
                value={pureInput}
                onChange={e => setPureInput(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2 px-4 pb-4">
              <UnitSelect label="From" value={from} units={UNIT_GROUPS[group]} onChange={setFrom} />
              <button onClick={() => { setFrom(to); setTo(from) }}
                className="mb-0.5 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-surface)', color: 'var(--color-accent)' }}>
                <ArrowLeftRight size={16} />
              </button>
              <UnitSelect label="To" value={to} units={UNIT_GROUPS[group]} onChange={setTo} />
            </div>
            <div className="mx-4 mb-4 rounded-xl px-4 py-3 text-center" style={{ background: 'var(--color-surface)' }}>
              {pureResult != null ? (
                <>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)', fontFamily: "'Playfair Display', serif" }}>
                    {pureResult}
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {unitLabel(to)}
                  </div>
                </>
              ) : (
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {pureInput ? 'Cannot convert between those units' : 'Enter an amount above'}
                </div>
              )}
            </div>
          </div>

          {/* Reference table */}
          <div>
            <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
              QUICK REFERENCE — {parseFloat(pureInput) || 1} {unitLabel(from)}
            </p>
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
              {UNIT_GROUPS[group].filter(u => u !== from).map(u => {
                const r = convert(parseFloat(pureInput) || 1, from, u)
                if (r == null) return null
                return (
                  <div key={u} className="flex items-center justify-between px-4 py-2.5 border-b cursor-pointer"
                    style={{ borderColor: 'var(--color-border)' }}
                    onClick={() => { setTo(u); setPureInput(String(parseFloat(pureInput) || 1)) }}>
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{unitLabel(u)}</span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-text)' }}>
                      {formatResult(r)} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{u}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SystemTab({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors"
      style={active
        ? { background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)', borderBottom: '2px solid var(--color-accent)' }
        : { color: 'var(--color-text-muted)', borderBottom: '2px solid transparent' }}
    >
      {icon}{label}
    </button>
  )
}

function ResultRow({ icon, system, value, unit, active, unitOptions, selectedUnit, onUnitChange }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ background: active ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'transparent' }}>
      <div style={{ color: 'var(--color-accent)' }}>{icon}</div>
      <div className="flex-1">
        <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{system}</div>
        <div className="text-xl font-bold" style={{ color: 'var(--color-text)', fontFamily: "'Playfair Display', serif" }}>
          {formatResult(value)}
        </div>
      </div>
      <select
        value={selectedUnit}
        onChange={e => onUnitChange(e.target.value)}
        className="text-sm rounded-lg px-2 py-1.5 border"
        style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)', cursor: 'pointer' }}
      >
        {unitOptions.map(u => <option key={u} value={u}>{unitLabel(u)}</option>)}
      </select>
    </div>
  )
}

function UnitSelect({ label, value, units, onChange }) {
  return (
    <div className="flex-1">
      <label className="label">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="input" style={{ cursor: 'pointer' }}>
        {units.map(u => <option key={u} value={u}>{unitLabel(u)}</option>)}
      </select>
    </div>
  )
}
