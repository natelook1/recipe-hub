import { Search, X } from 'lucide-react'
import { useRecipes } from '../../context/RecipeContext.jsx'

export default function Header({ onAddClick }) {
  const { searchQuery, setSearchQuery, setActiveTag } = useRecipes()

  function handleClear() {
    setSearchQuery('')
    setActiveTag(null)
  }

  return (
    <header className="sticky top-0 z-30 bg-[#faf7f2]/95 backdrop-blur border-b border-[#e8ddd0] px-4 pt-safe-top">
      <div className="flex items-center gap-3 py-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a6a50]" />
          <input
            type="search"
            placeholder="Search recipes…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#f5f0e8] border border-[#e8ddd0] text-sm text-[#2c1a0e] placeholder:text-[#8a6a50] focus:outline-none focus:border-[#c2692f] transition-colors"
          />
          {searchQuery && (
            <button onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a6a50]">
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
