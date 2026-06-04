import { useState, useRef } from 'react'
import { X, Link, FileText, Camera, PenLine } from 'lucide-react'
import { ingestUrl, ingestText, ingestPhoto } from '../../api.js'
import { useRecipes } from '../../context/RecipeContext.jsx'
import ExtractionProgress from './ExtractionProgress.jsx'
import DraftEditor from './DraftEditor.jsx'
import { showToast } from '../layout/Toast.jsx'

const TABS = [
  { id: 'url',    label: 'URL',    Icon: Link     },
  { id: 'text',   label: 'Paste',  Icon: FileText },
  { id: 'manual', label: 'Manual', Icon: PenLine  },
  { id: 'photo',  label: 'Photo',  Icon: Camera },
]

const EMPTY_DRAFT = {
  title: '', description: '', servings: 4, prep_time: null, cook_time: null,
  tags: [], ingredients: [], steps: [], source_url: '', source_type: 'manual',
}

// Sites that block server-side fetching — explain why and what to do instead
const BLOCKED_SITES = {
  'pinterest.com':    { reason: "Pinterest blocks automated access.", tip: "Open the pin, tap the link to the original recipe site, then paste that URL here instead." },
  'pinterest.co.uk':  { reason: "Pinterest blocks automated access.", tip: "Open the pin, tap the link to the original recipe site, then paste that URL here instead." },
  'pinterest.ca':     { reason: "Pinterest blocks automated access.", tip: "Open the pin, tap the link to the original recipe site, then paste that URL here instead." },
  'pin.it':           { reason: "Pinterest blocks automated access.", tip: "Open the pin, tap the link to the original recipe site, then paste that URL here instead." },
  'instagram.com':    { reason: "Instagram requires login to view content.", tip: "Copy the recipe text from the caption and use the Paste tab instead." },
  'tiktok.com':       { reason: "TikTok blocks automated access.", tip: "Copy the recipe text from the description and use the Paste tab instead." },
  'facebook.com':     { reason: "Facebook requires login to view content.", tip: "Copy the recipe text and use the Paste tab instead." },
}

export default function AddRecipeSheet({ onClose }) {
  const { settings } = useRecipes()
  const [tab, setTab]         = useState('url')
  const [url, setUrl]         = useState('')
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [draft, setDraft]     = useState(null)
  const [urlWarning, setUrlWarning] = useState(null)
  const fileRef               = useRef(null)
  const galleryRef            = useRef(null)

  const preferred = settings.preferred_unit_system || 'metric'

  function isBlockedSite(u) {
    try {
      const host = new URL(u).hostname.replace('www.', '')
      return BLOCKED_SITES[host] ?? null
    } catch { return null }
  }

  async function handleUrlExtract() {
    if (!url.trim()) return
    const blocked = isBlockedSite(url.trim())
    if (blocked) {
      setUrlWarning(blocked)
      return
    }
    setUrlWarning(null)
    setLoading(true)
    try {
      const result = await ingestUrl(url.trim(), preferred)
      setDraft({ ...result, source_url: url.trim(), source_type: 'url' })
    } catch (e) {
      showToast(e.message || 'Extraction failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleTextExtract() {
    if (!text.trim()) return
    setLoading(true)
    try {
      const result = await ingestText(text.trim(), preferred)
      setDraft({ ...result, source_type: 'text' })
    } catch (e) {
      showToast(e.message || 'Extraction failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handlePhotoExtract(file) {
    setLoading(true)
    try {
      const result = await ingestPhoto(file, preferred)
      setDraft({ ...result, source_type: 'photo' })
    } catch (e) {
      showToast(e.message || 'Extraction failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  function startManual() {
    setDraft({ ...EMPTY_DRAFT })
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet-in rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden" style={{ background: 'var(--color-bg-card)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-text)' }}>
            {draft ? 'Review & Save' : 'Add Recipe'}
          </h2>
          <div className="flex gap-2">
            {draft && (
              <button onClick={() => setDraft(null)} className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>← Back</button>
            )}
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab bar — fixed, never scrolls away */}
        {!loading && !draft && (
          <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            {TABS.map(({ id, label, Icon, soon }) => (
              <button
                key={id}
                onClick={() => !soon && setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                  soon ? 'border-transparent opacity-40 cursor-not-allowed' : 'border-transparent'
                }`}
                style={{
                  borderBottomColor: tab === id ? 'var(--color-accent)' : 'transparent',
                  color: tab === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                <Icon size={14} />
                {label}
                {soon && <span className="text-[9px] leading-none ml-0.5 opacity-70">soon</span>}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {loading && <ExtractionProgress />}
          {!loading && draft && <DraftEditor draft={draft} onClose={onClose} />}
          {!loading && !draft && (
            <div className="p-4 space-y-4">
              {/* URL tab */}
              {tab === 'url' && (
                <>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Paste a recipe URL and we'll extract it automatically.</p>
                  <input
                    className="input"
                    type="url"
                    placeholder="https://www.allrecipes.com/recipe/..."
                    value={url}
                    onChange={e => { setUrl(e.target.value); setUrlWarning(null) }}
                    onKeyDown={e => e.key === 'Enter' && handleUrlExtract()}
                  />
                  {urlWarning && (
                    <div className="rounded-xl p-3 text-sm" style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', border: '1px solid var(--color-accent-soft)' }}>
                      <p className="font-semibold mb-1" style={{ color: 'var(--color-accent)' }}>Can't extract from this site</p>
                      <p style={{ color: 'var(--color-text)' }}>{urlWarning.reason}</p>
                      <p className="mt-1.5" style={{ color: 'var(--color-text-muted)' }}><span className="font-medium">Tip:</span> {urlWarning.tip}</p>
                    </div>
                  )}
                  <button onClick={handleUrlExtract} disabled={!url.trim()}
                    className="w-full py-3.5 font-semibold rounded-xl disabled:opacity-40 transition-colors text-white"
                    style={{ background: 'var(--color-accent)' }}>
                    Extract Recipe
                  </button>
                </>
              )}

              {/* Text tab */}
              {tab === 'text' && (
                <>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Paste recipe text from anywhere and we'll parse it into a structured recipe.</p>
                  <textarea className="input resize-none" rows={8} placeholder="Paste recipe text here…"
                    value={text} onChange={e => setText(e.target.value)} />
                  <button onClick={handleTextExtract} disabled={!text.trim()}
                    className="w-full py-3.5 font-semibold rounded-xl disabled:opacity-40 transition-colors text-white"
                    style={{ background: 'var(--color-accent)' }}>
                    Extract Recipe
                  </button>
                </>
              )}

              {/* Photo tab */}
              {tab === 'photo' && (
                <>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Take a photo or upload an image of a recipe card or cookbook page.</p>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => e.target.files?.[0] && handlePhotoExtract(e.target.files[0])} />
                  <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handlePhotoExtract(e.target.files[0])} />
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => fileRef.current?.click()}
                      className="py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 transition-colors"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      <Camera size={28} />
                      <span className="text-sm font-medium">Take Photo</span>
                    </button>
                    <button onClick={() => galleryRef.current?.click()}
                      className="py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 transition-colors"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      <FileText size={28} />
                      <span className="text-sm font-medium">Choose File</span>
                    </button>
                  </div>
                </>
              )}

              {/* Manual tab */}
              {tab === 'manual' && (
                <>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Enter your recipe by hand.</p>
                  <button onClick={startManual}
                    className="w-full py-3.5 font-semibold rounded-xl transition-colors text-white"
                    style={{ background: 'var(--color-accent)' }}>
                    Start from Scratch
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
