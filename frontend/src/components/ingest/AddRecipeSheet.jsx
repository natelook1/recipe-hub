import { useState, useRef } from 'react'
import { X, Link, FileText, Camera, PenLine } from 'lucide-react'
import { ingestUrl, ingestText, ingestPhoto } from '../../api.js'
import { useRecipes } from '../../context/RecipeContext.jsx'
import ExtractionProgress from './ExtractionProgress.jsx'
import DraftEditor from './DraftEditor.jsx'
import { showToast } from '../layout/Toast.jsx'

const TABS = [
  { id: 'url',    label: 'URL',    Icon: Link     },
  { id: 'manual', label: 'Manual', Icon: PenLine  },
  { id: 'text',   label: 'Paste',  Icon: FileText, soon: true },
  { id: 'photo',  label: 'Photo',  Icon: Camera,   soon: true },
]

const EMPTY_DRAFT = {
  title: '', description: '', servings: 4, prep_time: null, cook_time: null,
  tags: [], ingredients: [], steps: [], source_url: '', source_type: 'manual',
}

export default function AddRecipeSheet({ onClose }) {
  const { settings } = useRecipes()
  const [tab, setTab]       = useState('url')
  const [url, setUrl]       = useState('')
  const [text, setText]     = useState('')
  const [loading, setLoading] = useState(false)
  const [draft, setDraft]   = useState(null)
  const fileRef             = useRef(null)

  const preferred = settings.preferred_unit_system || 'metric'

  async function handleUrlExtract() {
    if (!url.trim()) return
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
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#e8ddd0] flex-shrink-0">
          <h2 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-text)' }}>
            {draft ? 'Review & Save' : 'Add Recipe'}
          </h2>
          <div className="flex gap-2">
            {draft && (
              <button onClick={() => setDraft(null)} className="text-sm text-[#8a6a50] hover:text-[#c2692f] font-medium">← Back</button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center">
              <X size={16} className="text-[#8a6a50]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <ExtractionProgress />}

          {!loading && draft && (
            <DraftEditor draft={draft} onClose={onClose} />
          )}

          {!loading && !draft && (
            <>
              {/* Tab bar */}
              <div className="flex border-b border-[#e8ddd0] px-4 flex-shrink-0">
                {TABS.map(({ id, label, Icon, soon }) => (
                  <button
                    key={id}
                    onClick={() => !soon && setTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                      tab === id
                        ? 'border-[#c2692f] text-[#c2692f]'
                        : soon
                          ? 'border-transparent opacity-40 cursor-not-allowed'
                          : 'border-transparent'
                    }`}
                    style={{ color: tab === id ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                  >
                    <Icon size={14} />
                    {label}
                    {soon && <span className="text-[9px] leading-none ml-0.5 opacity-70">soon</span>}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-4">
                {/* URL tab */}
                {tab === 'url' && (
                  <>
                    <p className="text-sm text-[#8a6a50]">Paste a recipe URL and we'll extract it automatically.</p>
                    <input
                      className="input"
                      type="url"
                      placeholder="https://www.example.com/chocolate-cake"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUrlExtract()}
                    />
                    <button
                      onClick={handleUrlExtract}
                      disabled={!url.trim()}
                      className="w-full py-3 bg-[#c2692f] text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-[#a85426] transition-colors"
                    >
                      Extract Recipe
                    </button>
                  </>
                )}

                {/* Text tab */}
                {tab === 'text' && (
                  <>
                    <p className="text-sm text-[#8a6a50]">Paste recipe text from anywhere — we'll parse it into a structured recipe.</p>
                    <textarea
                      className="input resize-none"
                      rows={8}
                      placeholder="Paste recipe text here…"
                      value={text}
                      onChange={e => setText(e.target.value)}
                    />
                    <button
                      onClick={handleTextExtract}
                      disabled={!text.trim()}
                      className="w-full py-3 bg-[#c2692f] text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-[#a85426] transition-colors"
                    >
                      Extract Recipe
                    </button>
                  </>
                )}

                {/* Photo tab */}
                {tab === 'photo' && (
                  <>
                    <p className="text-sm text-[#8a6a50]">Take a photo or upload an image of a recipe card or cookbook page.</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handlePhotoExtract(e.target.files[0])}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full py-10 border-2 border-dashed border-[#e8ddd0] rounded-xl flex flex-col items-center gap-2 text-[#8a6a50] hover:border-[#c2692f] hover:text-[#c2692f] transition-colors"
                    >
                      <Camera size={32} />
                      <span className="text-sm font-medium">Take photo or choose image</span>
                    </button>
                  </>
                )}

                {/* Manual tab */}
                {tab === 'manual' && (
                  <>
                    <p className="text-sm text-[#8a6a50]">Enter your recipe by hand.</p>
                    <button
                      onClick={startManual}
                      className="w-full py-3 bg-[#c2692f] text-white font-semibold rounded-xl hover:bg-[#a85426] transition-colors"
                    >
                      Start from Scratch
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
