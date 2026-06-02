import { useRecipes } from '../../context/RecipeContext.jsx'
import RecipeCard from './RecipeCard.jsx'
import TagFilter from '../search/TagFilter.jsx'
import { BookOpen, PlusCircle } from 'lucide-react'

export default function RecipeBrowser({ onSelect, onAdd }) {
  const { recipes, loading, searchQuery, activeTag } = useRecipes()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="spinner w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <TagFilter />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {recipes.length === 0 ? (
          <EmptyState query={searchQuery} tag={activeTag} onAdd={onAdd} />
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

function EmptyState({ query, tag, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <BookOpen size={48} className="mb-4" style={{ color: 'var(--color-border)' }} />
      {query || tag ? (
        <>
          <p className="font-medium" style={{ color: 'var(--color-text)' }}>No recipes found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Try a different search or tag</p>
        </>
      ) : (
        <>
          <p className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-text)' }}>
            Your recipe collection is empty
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Add your first recipe to get started
          </p>
          <button
            onClick={onAdd}
            className="mt-6 flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-colors"
            style={{ background: 'var(--color-accent)' }}
          >
            <PlusCircle size={16} />
            Add a Recipe
          </button>
        </>
      )}
    </div>
  )
}
