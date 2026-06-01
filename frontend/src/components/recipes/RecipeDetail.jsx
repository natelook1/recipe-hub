import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Users, Link, Trash2 } from 'lucide-react'
import { getRecipe, deleteRecipe, getRecipeImageUrl } from '../../api.js'
import { useRecipes } from '../../context/RecipeContext.jsx'
import { useUnitToggle } from '../../hooks/useUnitToggle.js'
import IngredientList from './IngredientList.jsx'
import StepList from './StepList.jsx'
import { showToast } from '../layout/Toast.jsx'

export default function RecipeDetail({ recipeId, onBack }) {
  const { settings, reload } = useRecipes()
  const [recipe, setRecipe]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [servings, setServings]     = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { system, toggle, isMetric } = useUnitToggle(settings.preferred_unit_system)

  useEffect(() => {
    setLoading(true)
    getRecipe(recipeId)
      .then(r => { setRecipe(r); setServings(r.servings) })
      .catch(() => showToast('Failed to load recipe', 'error'))
      .finally(() => setLoading(false))
  }, [recipeId])

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      await deleteRecipe(recipeId)
      showToast('Recipe deleted')
      reload()
      onBack()
    } catch {
      showToast('Failed to delete', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8 border-2 border-[#c2692f] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!recipe) return null

  const steps       = JSON.parse(recipe.steps || '[]')
  const ingredients = recipe.ingredients || []
  const tags        = recipe.tags || []
  const scale       = servings / recipe.servings

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      {/* Hero image */}
      <div className="relative w-full aspect-[16/9] flex-shrink-0 bg-gradient-to-br from-[#f2d4c1] to-[#e8956b]">
        {recipe.image_path && (
          <img src={getRecipeImageUrl(recipe.id)} alt={recipe.title} className="w-full h-full object-cover" />
        )}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow"
        >
          <ArrowLeft size={18} className="text-[#2c1a0e]" />
        </button>
        <button
          onClick={handleDelete}
          className={`absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur flex items-center justify-center shadow transition-colors ${
            confirmDelete ? 'bg-red-500' : 'bg-white/90'
          }`}
        >
          <Trash2 size={16} className={confirmDelete ? 'text-white' : 'text-[#8a6a50]'} />
        </button>
        {confirmDelete && (
          <div className="absolute top-14 right-4 bg-white rounded-xl shadow-lg p-3 text-sm text-[#2c1a0e] border border-[#e8ddd0] w-48">
            <p className="font-medium mb-2">Delete this recipe?</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white rounded-lg py-1 text-xs font-medium">Delete</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 bg-[#f5f0e8] text-[#2c1a0e] rounded-lg py-1 text-xs font-medium">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Title + meta */}
        <div>
          <h1 className="text-2xl font-bold text-[#2c1a0e] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="text-[#8a6a50] text-sm mt-1.5">{recipe.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-[#8a6a50]">
            {(recipe.prep_time || recipe.cook_time) && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {(recipe.prep_time || 0) + (recipe.cook_time || 0)}m
              </span>
            )}
            {recipe.source_url && (
              <a href={recipe.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#c2692f]">
                <Link size={14} /> Source
              </a>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map(t => (
                <span key={t} className="px-2.5 py-0.5 bg-[#f2d4c1] text-[#c2692f] rounded-full text-xs font-medium">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Servings + unit toggle */}
        <div className="flex items-center justify-between bg-[#f5f0e8] rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Users size={16} className="text-[#8a6a50]" />
            <span className="text-sm text-[#2c1a0e] font-medium">Servings</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-7 h-7 rounded-full bg-[#e8ddd0] text-[#2c1a0e] font-bold flex items-center justify-center hover:bg-[#c2692f] hover:text-white transition-colors">−</button>
              <span className="w-6 text-center text-sm font-semibold text-[#2c1a0e]">{servings}</span>
              <button onClick={() => setServings(s => s + 1)} className="w-7 h-7 rounded-full bg-[#e8ddd0] text-[#2c1a0e] font-bold flex items-center justify-center hover:bg-[#c2692f] hover:text-white transition-colors">+</button>
            </div>
          </div>

          <button
            onClick={toggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
              isMetric
                ? 'border-[#4a7c59] text-[#4a7c59] bg-white'
                : 'border-[#c2692f] text-[#c2692f] bg-white'
            }`}
          >
            <span className={isMetric ? 'font-bold' : 'opacity-50'}>g/ml</span>
            <span className="opacity-30">·</span>
            <span className={!isMetric ? 'font-bold' : 'opacity-50'}>oz/cup</span>
          </button>
        </div>

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-[#2c1a0e] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ingredients
            </h2>
            <IngredientList ingredients={ingredients} system={system} servingsScale={scale} />
          </section>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-[#2c1a0e] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Instructions
            </h2>
            <StepList steps={steps} system={system} />
          </section>
        )}
      </div>
    </div>
  )
}
