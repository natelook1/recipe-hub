import { useState, useEffect } from 'react'
import { BookmarkPlus, RefreshCw, ExternalLink } from 'lucide-react'
import { getSuggestions, saveSuggestion } from '../../api.js'
import { useRecipes } from '../../context/RecipeContext.jsx'
import { showToast } from '../layout/Toast.jsx'

export default function DiscoverPage() {
  const { reload }                      = useRecipes()
  const [suggestions, setSuggestions]   = useState([])
  const [userTags, setUserTags]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(null) // link being saved
  const [saved, setSaved]               = useState(new Set())

  async function load() {
    setLoading(true)
    try {
      const data = await getSuggestions()
      setSuggestions(data.suggestions)
      setUserTags(data.userTags)
    } catch (e) {
      showToast('Could not load suggestions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(item) {
    if (saved.has(item.link) || saving) return
    setSaving(item.link)
    try {
      await saveSuggestion(item.link, item.title)
      setSaved(s => new Set([...s, item.link]))
      reload()
      showToast('Added to your recipes!')
    } catch (e) {
      showToast('Failed to save recipe', 'error')
    } finally {
      setSaving(null)
    }
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
              isSaving={saving === item.link}
              onSave={() => handleSave(item)}
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

function SuggestionCard({ item, isSaved, isSaving, onSave }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
      {item.image && (
        <div className="h-44 w-full overflow-hidden">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy"
            onError={e => { e.target.parentElement.style.display = 'none' }} />
        </div>
      )}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-accent)' }}>{item.source}</p>
            <h3 className="font-semibold leading-snug" style={{ color: 'var(--color-text)', fontFamily: 'Playfair Display, serif' }}>
              {item.title}
            </h3>
          </div>
          <a href={item.link} target="_blank" rel="noreferrer" className="flex-shrink-0 p-1.5 rounded-lg mt-0.5"
            style={{ color: 'var(--color-text-muted)' }}>
            <ExternalLink size={15} />
          </a>
        </div>

        {item.description && (
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
            {item.description}
          </p>
        )}

        <button
          onClick={onSave}
          disabled={isSaved || isSaving}
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={isSaved
            ? { background: 'var(--color-surface)', color: 'var(--color-text-muted)' }
            : { background: 'var(--color-accent)', color: 'white' }
          }>
          <BookmarkPlus size={16} />
          {isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Add to My Recipes'}
        </button>
      </div>
    </div>
  )
}
