import { Search, X, Sun, Moon } from 'lucide-react'
import { useRecipes } from '../../context/RecipeContext.jsx'

export default function Header({ dark, onToggleDark }) {
  const { searchQuery, setSearchQuery, setActiveTag } = useRecipes()

  function handleClear() {
    setSearchQuery('')
    setActiveTag(null)
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur border-b px-4 pt-safe-top" style={{ background: 'var(--color-header-bg)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-2 py-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="search"
            placeholder="Search recipes…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl text-sm focus:outline-none transition-colors"
            style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          {searchQuery && (
            <button onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={onToggleDark}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
