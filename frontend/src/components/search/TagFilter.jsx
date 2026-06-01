import { useRecipes } from '../../context/RecipeContext.jsx'
import TagBadge from '../recipes/TagBadge.jsx'

export default function TagFilter() {
  const { tags, activeTag, setActiveTag } = useRecipes()

  if (!tags.length) return null

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
      <button
        onClick={() => setActiveTag(null)}
        className={`px-3 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
          !activeTag ? 'bg-[#2c1a0e] text-white' : 'bg-[#f5f0e8] text-[#8a6a50] hover:bg-[#e8ddd0]'
        }`}
      >
        All
      </button>
      {tags.map(({ tag }) => (
        <TagBadge
          key={tag}
          tag={tag}
          active={activeTag === tag}
          onClick={() => setActiveTag(activeTag === tag ? null : tag)}
        />
      ))}
    </div>
  )
}
