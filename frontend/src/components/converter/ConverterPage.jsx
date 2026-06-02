import { useState, useMemo } from 'react'
import { convert, formatResult, CONVERSIONS, UNIT_GROUPS, GROUP_LABELS, normalizeUnit } from '../../lib/units.js'
import { convertWithDensity, INGREDIENT_LIST, DENSITIES, CATEGORIES } from '../../lib/densities.js'
import { ArrowLeftRight, Search } from 'lucide-react'

const WEIGHT_UNITS = ['g', 'kg', 'oz', 'lb']
const VOLUME_UNITS = ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz', 'pt', 'qt']

const GROUPS = [...Object.keys(UNIT_GROUPS), 'ingredient']
const ALL_GROUP_LABELS = { ...GROUP_LABELS, ingredient: 'Ingredient' }

export default function ConverterPage() {
  const [group, setGroup]           = useState('ingredient')
  const [from, setFrom]             = useState('g')
  const [to, setTo]                 = useState('cup')
  const [input, setInput]           = useState('')
  const [ingredient, setIngredient] = useState('all-purpose flour')
  const [ingSearch, setIngSearch]   = useState('')

  const units = group === 'ingredient' ? [...WEIGHT_UNITS, ...VOLUME_UNITS] : UNIT_GROUPS[group]

  function switchGroup(g) {
    setGroup(g)
    if (g === 'ingredient') {
      setFrom('g'); setTo('cup')
    } else {
      setFrom(UNIT_GROUPS[g][0]); setTo(UNIT_GROUPS[g][1])
    }
    setInput('')
  }

  function swap() { setFrom(to); setTo(from) }

  const result = useMemo(() => {
    const n = parseFloat(input)
    if (!input || isNaN(n)) return null

    if (group === 'ingredient') {
      const r = convertWithDensity(n, from, to, ingredient)
      if (r) return { value: formatResult(r.amount), unit: r.unit, wasDensity: true }
      // same-type fallback
      const r2 = convert(n, from, to)
      return r2 != null ? { value: formatResult(r2), unit: to, wasDensity: false } : null
    }

    const r = convert(n, from, to)
    return r != null ? { value: formatResult(r), unit: to, wasDensity: false } : null
  }, [input, from, to, group, ingredient])

  const refInput = parseFloat(input) || 100
  const tableUnits = (group === 'ingredient' ? units : units.slice(0, 8)).filter(u => u !== from)

  const filteredIngredients = useMemo(() => {
    const q = ingSearch.toLowerCase()
    return q ? INGREDIENT_LIST.filter(i => i.includes(q)) : INGREDIENT_LIST
  }, [ingSearch])

  const ingredientsByCategory = useMemo(() => {
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
      <div className="px-4 pt-5 pb-2">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-text)' }}>
          Unit Converter
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          All cooking &amp; baking units — including weight ↔ volume by ingredient
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
            {ALL_GROUP_LABELS[g]}
          </button>
        ))}
      </div>

      {/* Ingredient picker (only for ingredient tab) */}
      {group === 'ingredient' && (
        <div className="mx-4 mt-2 rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <div className="px-4 pt-3 pb-2">
            <p className="label mb-1">Ingredient</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input
                className="input pl-8 text-sm"
                placeholder="Search ingredients…"
                value={ingSearch}
                onChange={e => setIngSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {Object.entries(ingredientsByCategory).map(([cat, names]) => (
              <div key={cat}>
                <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
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
          {/* Selected ingredient density info */}
          <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>
              {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}
            </span>
            {' '}= {DENSITIES[ingredient]?.gPerCup}g per cup
          </div>
        </div>
      )}

      {/* Converter card */}
      <div className="mx-4 mt-3 rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
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

        <div className="flex items-end gap-2 px-4 pb-4">
          <UnitSelect label="From" value={from} units={units} onChange={v => setFrom(v)} group={group} />
          <button
            onClick={swap}
            className="mb-0.5 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-surface)', color: 'var(--color-accent)' }}
          >
            <ArrowLeftRight size={16} />
          </button>
          <UnitSelect label="To" value={to} units={units} onChange={v => setTo(v)} group={group} />
        </div>

        <div className="mx-4 mb-4 rounded-xl px-4 py-3 text-center" style={{ background: 'var(--color-surface)' }}>
          {result ? (
            <>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)', fontFamily: "'Playfair Display', serif" }}>
                {result.value}
              </div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {CONVERSIONS[normalizeUnit(result.unit)]?.label ?? result.unit}
                {result.wasDensity && (
                  <span className="ml-1 opacity-60">· density conversion</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {input ? 'Select matching unit types or choose an ingredient' : 'Enter an amount above'}
            </div>
          )}
        </div>
      </div>

      {/* Quick reference table */}
      <div className="mx-4 mt-4">
        <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
          QUICK REFERENCE — {refInput} {CONVERSIONS[normalizeUnit(from)]?.label ?? from}
          {group === 'ingredient' && ` of ${ingredient}`}
        </p>
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          {tableUnits.map(u => {
            let r = null
            if (group === 'ingredient') {
              const res = convertWithDensity(refInput, from, u, ingredient)
              r = res ? res.amount : convert(refInput, from, u)
            } else {
              r = convert(refInput, from, u)
            }
            if (r == null) return null
            return (
              <div
                key={u}
                className="flex items-center justify-between px-4 py-2.5 border-b cursor-pointer"
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
    </div>
  )
}

function UnitSelect({ label, value, units, onChange, group }) {
  const weightUnits = ['g', 'kg', 'oz', 'lb']
  const volumeUnits = ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz', 'pt', 'qt']

  if (group === 'ingredient') {
    return (
      <div className="flex-1">
        <label className="label">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="input" style={{ cursor: 'pointer' }}>
          <optgroup label="Weight">
            {weightUnits.map(u => <option key={u} value={u}>{CONVERSIONS[normalizeUnit(u)]?.label ?? u}</option>)}
          </optgroup>
          <optgroup label="Volume">
            {volumeUnits.map(u => <option key={u} value={u}>{CONVERSIONS[normalizeUnit(u)]?.label ?? u}</option>)}
          </optgroup>
        </select>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <label className="label">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="input" style={{ cursor: 'pointer' }}>
        {units.map(u => (
          <option key={u} value={u}>{CONVERSIONS[normalizeUnit(u)]?.label ?? u}</option>
        ))}
      </select>
    </div>
  )
}
