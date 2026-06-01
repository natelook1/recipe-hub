import { Clock } from 'lucide-react'
import { getRecipeImageUrl } from '../../api.js'
import TagBadge from './TagBadge.jsx'

const PLACEHOLDER_COLORS = [
  'from-[#f2d4c1] to-[#e8956b]',
  'from-[#d4e8d4] to-[#4a7c59]',
  'from-[#f0e8d4] to-[#c2692f]',
  'from-[#d4dce8] to-[#6b8ab0]',
]

function pickColor(title) {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0
  return PLACEHOLDER_COLORS[Math.abs(h) % PLACEHOLDER_COLORS.length]
}

export default function RecipeCard({ recipe, onClick }) {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
  const tags = recipe.tags || []
  const hasImage = !!recipe.image_path

  return (
    <button
      onClick={onClick}
      className="fade-up group w-full text-left bg-white rounded-2xl shadow-sm border border-[#e8ddd0] overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        {hasImage ? (
          <img
            src={getRecipeImageUrl(recipe.id)}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${pickColor(recipe.title)} flex items-center justify-center`}>
            <span className="text-4xl opacity-60">🍽️</span>
          </div>
        )}
        {totalTime > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
            <Clock size={11} />
            {totalTime}m
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-[#2c1a0e] text-sm leading-snug line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-[#8a6a50] text-xs mt-0.5 line-clamp-2">{recipe.description}</p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map(t => (
              <TagBadge key={t} tag={t} />
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
