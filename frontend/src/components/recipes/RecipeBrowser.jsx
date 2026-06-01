import { useRecipes } from '../../context/RecipeContext.jsx'
import RecipeCard from './RecipeCard.jsx'
import TagFilter from '../search/TagFilter.jsx'
import { BookOpen } from 'lucide-react'

export default function RecipeBrowser({ onSelect }) {
  const { recipes, loading, searchQuery, activeTag } = useRecipes()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-[#8a6a50]">
        <div className="spinner w-6 h-6 border-2 border-[#c2692f] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <TagFilter />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {recipes.length === 0 ? (
          <EmptyState query={searchQuery} tag={activeTag} />
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
            {recipes.map((r, i) => (
              <div key={r.id} style={{ animationDelay: `${i * 40}ms` }}>
                <RecipeCard recipe={r} onClick={() => onSelect(r.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ query, tag }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BookOpen size={48} className="text-[#e8ddd0] mb-4" />
      {query || tag ? (
        <>
          <p className="text-[#2c1a0e] font-medium">No recipes found</p>
          <p className="text-[#8a6a50] text-sm mt-1">Try a different search or tag</p>
        </>
      ) : (
        <>
          <p className="text-[#2c1a0e] font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
            Your recipe collection is empty
          </p>
          <p className="text-[#8a6a50] text-sm mt-1">Tap + to add your first recipe</p>
        </>
      )}
    </div>
  )
}
