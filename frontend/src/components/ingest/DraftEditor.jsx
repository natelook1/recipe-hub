import { useState } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'
import { ingestConfirm } from '../../api.js'
import { useRecipes } from '../../context/RecipeContext.jsx'
import { showToast } from '../layout/Toast.jsx'

export default function DraftEditor({ draft, onClose }) {
  const { reload } = useRecipes()
  const [form, setForm]       = useState(draft)
  const [saving, setSaving]   = useState(false)

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function setIngField(i, key, val) {
    setForm(f => {
      const ings = [...f.ingredients]
      ings[i] = { ...ings[i], [key]: val }
      return { ...f, ingredients: ings }
    })
  }

  function addIngredient() {
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', amount: '', unit: '', notes: '' }] }))
  }

  function removeIngredient(i) {
    setForm(f => { const a = [...f.ingredients]; a.splice(i, 1); return { ...f, ingredients: a } })
  }

  function setStep(i, val) {
    setForm(f => { const s = [...f.steps]; s[i] = val; return { ...f, steps: s } })
  }

  function addStep() { setForm(f => ({ ...f, steps: [...f.steps, ''] })) }
  function removeStep(i) { setForm(f => { const s = [...f.steps]; s.splice(i, 1); return { ...f, steps: s } }) }

  async function handleSave() {
    if (!form.title.trim()) { showToast('Title is required', 'error'); return }
    setSaving(true)
    try {
      await ingestConfirm(form)
      showToast('Recipe saved!')
      reload()
      onClose()
    } catch (e) {
      showToast(e.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      {/* Title */}
      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Recipe name" />
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Short description" />
      </div>

      {/* Servings / times */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">Servings</label>
          <input className="input" type="number" min={1} value={form.servings || ''} onChange={e => setField('servings', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Prep (min)</label>
          <input className="input" type="number" min={0} value={form.prep_time || ''} onChange={e => setField('prep_time', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Cook (min)</label>
          <input className="input" type="number" min={0} value={form.cook_time || ''} onChange={e => setField('cook_time', Number(e.target.value))} />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="label">Tags (comma-separated)</label>
        <input
          className="input"
          value={(form.tags || []).join(', ')}
          onChange={e => setField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
          placeholder="dessert, italian, vegetarian"
        />
      </div>

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Ingredients</label>
          <button onClick={addIngredient} className="text-xs text-[#c2692f] font-medium flex items-center gap-1">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {(form.ingredients || []).map((ing, i) => (
            <div key={i} className="flex gap-2 items-start">
              <GripVertical size={16} className="mt-2.5 text-[#e8ddd0] flex-shrink-0" />
              <input className="input w-16 flex-shrink-0" placeholder="Qty" value={ing.amount ?? ''} onChange={e => setIngField(i, 'amount', e.target.value)} />
              <input className="input w-16 flex-shrink-0" placeholder="Unit" value={ing.unit ?? ''} onChange={e => setIngField(i, 'unit', e.target.value)} />
              <input className="input flex-1" placeholder="Ingredient name" value={ing.name ?? ''} onChange={e => setIngField(i, 'name', e.target.value)} />
              <button onClick={() => removeIngredient(i)} className="mt-2 text-[#e8ddd0] hover:text-red-400 flex-shrink-0">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Instructions</label>
          <button onClick={addStep} className="text-xs text-[#c2692f] font-medium flex items-center gap-1">
            <Plus size={14} /> Add step
          </button>
        </div>
        <div className="space-y-2">
          {(form.steps || []).map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2 w-6 h-6 rounded-full bg-[#f2d4c1] text-[#c2692f] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <textarea
                className="input flex-1 resize-none"
                rows={2}
                value={step}
                onChange={e => setStep(i, e.target.value)}
                placeholder={`Step ${i + 1}`}
              />
              <button onClick={() => removeStep(i)} className="mt-2 text-[#e8ddd0] hover:text-red-400 flex-shrink-0">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-[#c2692f] text-white font-semibold rounded-xl hover:bg-[#a85426] transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save Recipe'}
      </button>
    </div>
  )
}
