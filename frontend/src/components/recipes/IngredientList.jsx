import { useState } from 'react'
import { convertIngredient, formatAmount } from '../../lib/units.js'

export default function IngredientList({ ingredients, system, servingsScale = 1 }) {
  const [checked, setChecked] = useState(new Set())

  function toggle(id) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <ul className="divide-y divide-[#f5f0e8]">
      {ingredients.map(ing => {
        const rawAmount = ing.amount != null ? ing.amount * servingsScale : null
        const { amount, unit } = convertIngredient(rawAmount, ing.unit, system)
        const done = checked.has(ing.id)

        return (
          <li
            key={ing.id}
            onClick={() => toggle(ing.id)}
            className={`flex items-start gap-3 py-2.5 cursor-pointer select-none transition-opacity ${done ? 'opacity-40' : ''}`}
          >
            <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              done ? 'bg-[#c2692f] border-[#c2692f]' : 'border-[#e8ddd0]'
            }`}>
              {done && <span className="text-white text-xs">✓</span>}
            </span>
            <span className="flex-1 text-sm text-[#2c1a0e]">
              {amount != null && (
                <span className="font-semibold">
                  {formatAmount(amount)}{unit ? ` ${unit}` : ''}{' '}
                </span>
              )}
              {ing.name}
              {ing.notes ? <span className="text-[#8a6a50]">, {ing.notes}</span> : null}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
