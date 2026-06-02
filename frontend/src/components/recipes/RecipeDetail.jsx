import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Clock, Users, Link, Trash2, Pencil, Camera, X, Check } from 'lucide-react'
import { getRecipe, deleteRecipe, updateRecipe, getRecipeImageUrl } from '../../api.js'
import { useRecipes } from '../../context/RecipeContext.jsx'
import { useUnitToggle } from '../../hooks/useUnitToggle.js'
import IngredientList from './IngredientList.jsx'
import StepList from './StepList.jsx'
import { showToast } from '../layout/Toast.jsx'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_KEY = import.meta.env.VITE_API_KEY || ''

export default function RecipeDetail({ recipeId, onBack }) {
  const { settings, reload } = useRecipes()
  const [recipe, setRecipe]               = useState(null)
  const [loading, setLoading]             = useState(true)
  const [servings, setServings]           = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing]             = useState(false)
  const [uploadingImg, setUploadingImg]   = useState(false)
  const imgInputRef                       = useRef(null)
  const { system, toggle, isMetric }      = useUnitToggle(settings.preferred_unit_system)

  function loadRecipe() {
    setLoading(true)
    getRecipe(recipeId)
      .then(r => { setRecipe(r); setServings(r.servings) })
      .catch(() => showToast('Failed to load recipe', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRecipe() }, [recipeId])

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      await deleteRecipe(recipeId)
      showToast('Recipe deleted')
      reload(); onBack()
    } catch { showToast('Failed to delete', 'error') }
  }

  async function handleImageUpload(file) {
    if (!file) return
    setUploadingImg(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BASE}/api/recipes/${recipeId}/image`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY },
        body: form,
      })
      if (!res.ok) throw new Error('Upload failed')
      showToast('Photo saved')
      loadRecipe()
    } catch { showToast('Upload failed', 'error') }
    finally { setUploadingImg(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!recipe) return null

  const steps       = Array.isArray(recipe.steps) ? recipe.steps : JSON.parse(recipe.steps || '[]')
  const ingredients = recipe.ingredients || []
  const tags        = recipe.tags || []
  const scale       = servings / recipe.servings
  const hasImage    = !!recipe.image_path

  if (editing) {
    return <RecipeEditor recipe={recipe} steps={steps} onClose={() => { setEditing(false); loadRecipe() }} />
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* Hero — shorter on mobile (aspect-[3/2]), taller on tablet+ */}
      <div className="relative w-full flex-shrink-0" style={{ background: 'var(--color-surface)', aspectRatio: '3/2' }}>
        {hasImage ? (
          <img src={getRecipeImageUrl(recipe.id)} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: 'var(--color-surface)' }}>
            <span className="text-5xl opacity-30">🍽️</span>
            <button
              onClick={() => imgInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--color-accent)' }}
            >
              <Camera size={14} /> Add photo
            </button>
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex gap-2">
            {hasImage && (
              <button
                onClick={() => imgInputRef.current?.click()}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
              >
                {uploadingImg
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
                  : <Camera size={16} className="text-white" />}
              </button>
            )}
            <button
              onClick={() => setEditing(true)}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
            >
              <Pencil size={16} className="text-white" />
            </button>
            <button
              onClick={handleDelete}
              className={`w-9 h-9 rounded-full backdrop-blur flex items-center justify-center transition-colors ${confirmDelete ? 'bg-red-500' : 'bg-black/40'}`}
            >
              <Trash2 size={16} className="text-white" />
            </button>
          </div>
        </div>

        {confirmDelete && (
          <div className="absolute top-14 right-4 rounded-xl shadow-lg p-3 text-sm border w-48" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            <p className="font-medium mb-2">Delete this recipe?</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white rounded-lg py-1 text-xs font-medium">Delete</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg py-1 text-xs font-medium" style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>Cancel</button>
            </div>
          </div>
        )}

        <input ref={imgInputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold leading-snug" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-text)' }}>
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{recipe.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {recipe.prep_time > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={14} /> Prep {recipe.prep_time}m
              </span>
            )}
            {recipe.cook_time > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={14} /> Cook {recipe.cook_time}m
              </span>
            )}
            {recipe.source_url && (
              <a href={recipe.source_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 active:opacity-60" style={{ color: 'var(--color-accent)' }}>
                <Link size={14} /> Source
              </a>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map(t => (
                <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Servings + unit toggle */}
        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--color-surface)' }}>
          <div className="flex items-center gap-3">
            <Users size={16} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Servings</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setServings(s => Math.max(1, s - 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold transition-colors"
                style={{ background: 'var(--color-border)', color: 'var(--color-text)' }}>−</button>
              <span className="w-6 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{servings}</span>
              <button onClick={() => setServings(s => s + 1)}
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold transition-colors"
                style={{ background: 'var(--color-border)', color: 'var(--color-text)' }}>+</button>
            </div>
          </div>
          <button onClick={toggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors"
            style={{
              borderColor: isMetric ? 'var(--color-green)' : 'var(--color-accent)',
              color: isMetric ? 'var(--color-green)' : 'var(--color-accent)',
              background: 'var(--color-bg-card)',
            }}>
            <span style={{ opacity: isMetric ? 1 : 0.4 }}>g/ml</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span style={{ opacity: isMetric ? 0.4 : 1 }}>oz/cup</span>
          </button>
        </div>

        {ingredients.length > 0 && (
          <section>
            <h2 className="text-base font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-text)' }}>
              Ingredients
            </h2>
            <IngredientList ingredients={ingredients} system={system} servingsScale={scale} />
          </section>
        )}

        {steps.length > 0 && (
          <section>
            <h2 className="text-base font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-text)' }}>
              Instructions
            </h2>
            <StepList steps={steps} system={system} />
          </section>
        )}
      </div>
    </div>
  )
}

// ─── Inline Editor ────────────────────────────────────────────────────────────

function RecipeEditor({ recipe, steps: initialSteps, onClose }) {
  const { reload } = useRecipes()
  const [form, setForm] = useState({
    title:       recipe.title,
    description: recipe.description || '',
    servings:    recipe.servings,
    prep_time:   recipe.prep_time || '',
    cook_time:   recipe.cook_time || '',
    tags:        (recipe.tags || []).join(', '),
    source_url:  recipe.source_url || '',
  })
  const [steps, setSteps]           = useState(initialSteps)
  const [ingredients, setIngredients] = useState(recipe.ingredients || [])
  const [saving, setSaving]         = useState(false)

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function setIngField(i, k, v) {
    setIngredients(a => { const n = [...a]; n[i] = { ...n[i], [k]: v }; return n })
  }

  async function save() {
    setSaving(true)
    try {
      await updateRecipe(recipe.id, {
        ...form,
        servings:  Number(form.servings) || 1,
        prep_time: form.prep_time ? Number(form.prep_time) : null,
        cook_time: form.cook_time ? Number(form.cook_time) : null,
        tags:      form.tags.split(',').map(t => t.trim()).filter(Boolean),
        steps,
        ingredients: ingredients.map((ing, i) => ({ ...ing, sort_order: i })),
        image_path: recipe.image_path || '',
      })
      showToast('Recipe saved')
      reload()
      onClose()
    } catch { showToast('Save failed', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* Editor header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: 'var(--color-header-bg)', borderColor: 'var(--color-border)' }}>
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          <X size={16} /> Cancel
        </button>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Edit Recipe</span>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl text-white"
          style={{ background: 'var(--color-accent)', opacity: saving ? 0.6 : 1 }}>
          <Check size={14} /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Basic fields */}
        <div><label className="label">Title</label>
          <input className="input" value={form.title} onChange={e => setField('title', e.target.value)} /></div>
        <div><label className="label">Description</label>
          <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setField('description', e.target.value)} /></div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="label">Servings</label>
            <input className="input" type="number" min={1} value={form.servings} onChange={e => setField('servings', e.target.value)} /></div>
          <div><label className="label">Prep (min)</label>
            <input className="input" type="number" min={0} value={form.prep_time} onChange={e => setField('prep_time', e.target.value)} /></div>
          <div><label className="label">Cook (min)</label>
            <input className="input" type="number" min={0} value={form.cook_time} onChange={e => setField('cook_time', e.target.value)} /></div>
        </div>
        <div><label className="label">Tags (comma-separated)</label>
          <input className="input" value={form.tags} onChange={e => setField('tags', e.target.value)} /></div>
        <div><label className="label">Source URL</label>
          <input className="input" type="url" value={form.source_url} onChange={e => setField('source_url', e.target.value)} /></div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Ingredients</label>
            <button onClick={() => setIngredients(a => [...a, { name: '', amount: '', unit: '', notes: '' }])}
              className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>+ Add</button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input className="input w-14 flex-shrink-0" placeholder="Qty" value={ing.amount ?? ''} onChange={e => setIngField(i, 'amount', e.target.value)} />
                <input className="input w-16 flex-shrink-0" placeholder="Unit" value={ing.unit ?? ''} onChange={e => setIngField(i, 'unit', e.target.value)} />
                <input className="input flex-1" placeholder="Ingredient" value={ing.name ?? ''} onChange={e => setIngField(i, 'name', e.target.value)} />
                <button onClick={() => setIngredients(a => a.filter((_, j) => j !== i))} className="mt-2 flex-shrink-0" style={{ color: 'var(--color-border)' }}>
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
            <button onClick={() => setSteps(s => [...s, ''])}
              className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>+ Add step</button>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="mt-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                  style={{ background: 'var(--color-accent)' }}>{i + 1}</span>
                <textarea className="input flex-1 resize-none" rows={2} value={step}
                  onChange={e => setSteps(s => { const n = [...s]; n[i] = e.target.value; return n })} />
                <button onClick={() => setSteps(s => s.filter((_, j) => j !== i))} className="mt-2 flex-shrink-0" style={{ color: 'var(--color-border)' }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
