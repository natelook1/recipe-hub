import { useState, useEffect, useRef } from 'react'
import { X, ExternalLink, BookmarkPlus, Clock, Users, Loader2 } from 'lucide-react'
import { extractSuggestion, saveSuggestion } from '../../api.js'
import { useRecipes } from '../../context/RecipeContext.jsx'
import { showToast } from '../layout/Toast.jsx'

export default function SuggestionPreviewSheet({ item, onClose, onSaved }) {
  const { reload }            = useRecipes()
  const [draft, setDraft]     = useState(null)
  const [extracting, setExtracting] = useState(true)
  const [extractError, setExtractError] = useState(false)
  const [saving, setSaving]   = useState(false)
  const abortRef              = useRef(null)

  useEffect(() => {
    abortRef.current = new AbortController()
    setExtracting(true)
    setExtractError(false)

    extractSuggestion(item.link, abortRef.current.signal)
      .then(d => { setDraft(d); setExtracting(false) })
      .catch(e => {
        if (e.name === 'AbortError') return
        setExtractError(true)
        setExtracting(false)
      })

    return () => abortRef.current?.abort()
  }, [item.link])

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    try {
      await saveSuggestion(draft, item.link, item.image)
      reload()
      showToast('Recipe saved!')
      onSaved()
    } catch (e) {
      showToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Hero image */}
      <div className="relative flex-shrink-0">
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full object-cover" style={{ maxHeight: '220px' }} />
        ) : (
          <div className="w-full h-40" style={{ background: 'var(--color-surface)' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 60%)' }} />
        <button onClick={onClose}
          className="absolute top-safe-top left-4 mt-3 p-2 rounded-full backdrop-blur"
          style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}>
          <X size={20} />
        </button>
        <a href={item.link} target="_blank" rel="noreferrer"
          className="absolute top-safe-top right-4 mt-3 p-2 rounded-full backdrop-blur"
          style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}>
          <ExternalLink size={18} />
        </a>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4 space-y-4">
          {/* Title & source */}
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-accent)' }}>{item.source}</p>
            <h2 className="text-xl font-bold leading-snug" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-text)' }}>
              {draft?.title || item.title}
            </h2>
          </div>

          {/* Times & servings — from draft once loaded */}
          {draft && (draft.prep_time || draft.cook_time || draft.servings) && (
            <div className="flex gap-4">
              {draft.servings && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <Users size={14} /> {draft.servings} servings
                </div>
              )}
              {(draft.prep_time || draft.cook_time) && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <Clock size={14} />
                  {[draft.prep_time && `${draft.prep_time}m prep`, draft.cook_time && `${draft.cook_time}m cook`].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {(draft?.description || item.description) && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {draft?.description || item.description}
            </p>
          )}

          {/* Ingredients */}
          <Section title="Ingredients" loading={extracting} error={extractError}>
            {draft?.ingredients?.length > 0 && (
              <ul className="space-y-1.5">
                {draft.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--color-text)' }}>
                    <span className="flex-shrink-0 font-medium" style={{ color: 'var(--color-accent)', minWidth: '3rem' }}>
                      {ing.amount != null ? `${ing.amount}${ing.unit ? ' ' + ing.unit : ''}` : ''}
                    </span>
                    <span>{ing.name}{ing.notes ? <span style={{ color: 'var(--color-text-muted)' }}>, {ing.notes}</span> : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Steps */}
          <Section title="Instructions" loading={extracting} error={extractError}>
            {draft?.steps?.length > 0 && (
              <ol className="space-y-3">
                {draft.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--color-text)' }}>
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {/* Tags */}
          {draft?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {draft.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 inset-x-0 px-4 pb-safe-bottom pt-3 border-t backdrop-blur"
        style={{ background: 'var(--color-nav-bg)', borderColor: 'var(--color-border)' }}>
        <button
          onClick={handleSave}
          disabled={saving || extracting || extractError || !draft}
          className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: 'var(--color-accent)' }}>
          {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> :
           extracting ? <><Loader2 size={18} className="animate-spin" /> Loading recipe…</> :
           extractError ? 'Could not load recipe' :
           <><BookmarkPlus size={18} /> Save Recipe</>}
        </button>
      </div>
    </div>
  )
}

function Section({ title, loading, error, children }) {
  return (
    <div>
      <h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-text)' }}>
        {title}
      </h3>
      {loading ? (
        <div className="flex items-center gap-2 py-3" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 size={16} className="animate-spin flex-shrink-0" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : error ? (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Could not extract — open the original page to view.</p>
      ) : children}
    </div>
  )
}
