import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink, ChevronRight } from 'lucide-react'
import { getSuggestions } from '../../api.js'
import { showToast } from '../layout/Toast.jsx'
import SuggestionPreviewSheet from './SuggestionPreviewSheet.jsx'

export default function DiscoverPage() {
  const [suggestions, setSuggestions]   = useState([])
  const [userTags, setUserTags]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState(null) // item being previewed
  const [saved, setSaved]               = useState(new Set())

  async function load() {
    setLoading(true)
    try {
      const data = await getSuggestions()
      setSuggestions(data.suggestions)
      setUserTags(data.userTags)
    } catch {
      showToast('Could not load suggestions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleSaved(link) {
    setSaved(s => new Set([...s, link]))
    setSelected(null)
  }

  if (selected) {
    return (
      <SuggestionPreviewSheet
        item={selected}
        onClose={() => setSelected(null)}
        onSaved={() => handleSaved(selected.link)}
      />
    )
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-safe-top pb-3 backdrop-blur border-b"
        style={{ background: 'var(--color-header-bg)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-text)' }}>Discover</h1>
            {userTags.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Based on: {userTags.slice(0, 5).join(', ')}
              </p>
            )}
          </div>
          <button onClick={load} disabled={loading}
            className="p-2 rounded-full transition-colors disabled:opacity-40"
            style={{ color: 'var(--color-text-muted)' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 gap-3"
          style={{ color: 'var(--color-text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" />
          <p className="text-sm">Finding recipes for you…</p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3">
          {suggestions.map(item => (
            <SuggestionCard
              key={item.link}
              item={item}
              isSaved={saved.has(item.link)}
              onSelect={() => !saved.has(item.link) && setSelected(item)}
            />
          ))}
          {suggestions.length === 0 && (
            <p className="text-center pt-16 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No suggestions right now — try refreshing.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function SuggestionCard({ item, isSaved, onSelect }) {
  return (
    <button
      onClick={onSelect}
      disabled={isSaved}
      className="w-full text-left rounded-2xl overflow-hidden border transition-opacity disabled:opacity-50"
      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
      {item.image && (
        <div className="h-44 w-full overflow-hidden">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy"
            onError={e => { e.target.parentElement.style.display = 'none' }} />
        </div>
      )}
      <div className="p-3 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-accent)' }}>{item.source}</p>
          <h3 className="font-semibold leading-snug mb-1" style={{ color: 'var(--color-text)', fontFamily: 'Playfair Display, serif' }}>
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
              {item.description}
            </p>
          )}
          {isSaved && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--color-green)' }}>Saved to your recipes</p>
          )}
        </div>
        <div className="flex-shrink-0 mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {isSaved ? null : <ChevronRight size={18} />}
        </div>
      </div>
    </button>
  )
}
