import { updateSettings } from '../../api.js'
import { useRecipes } from '../../context/RecipeContext.jsx'
import { showToast } from '../layout/Toast.jsx'
import ColorWheel from './ColorWheel.jsx'
import { Sun, Moon, RotateCcw } from 'lucide-react'

const card = { background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }

export default function SettingsPage({ dark, onToggleDark, theme }) {
  const { settings, setSettings, reloadSettings } = useRecipes()

  async function setUnit(system) {
    try {
      await updateSettings({ ...settings, preferred_unit_system: system })
      setSettings(s => ({ ...s, preferred_unit_system: system }))
      reloadSettings()
      showToast(`Switched to ${system === 'metric' ? 'metric' : 'imperial'}`)
    } catch {
      showToast('Failed to save', 'error')
    }
  }

  const isMetric = settings.preferred_unit_system === 'metric'

  return (
    <div className="flex flex-col px-4 py-6 gap-6 pb-28">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-text)' }}>
        Settings
      </h1>

      {/* Appearance */}
      <section className="rounded-2xl border overflow-hidden" style={card}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Appearance</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Personalise the look of your recipe collection
          </p>
        </div>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            {dark ? <Moon size={16} style={{ color: 'var(--color-accent)' }} /> : <Sun size={16} style={{ color: 'var(--color-accent)' }} />}
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {dark ? 'Dark mode' : 'Light mode'}
            </span>
          </div>
          <button
            onClick={onToggleDark}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: dark ? 'var(--color-accent)' : 'var(--color-border)' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: dark ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {/* Colour wheels */}
        <div className="px-4 py-4">
          <p className="text-xs font-semibold mb-4" style={{ color: 'var(--color-text-muted)' }}>
            THEME COLOURS — tap a wheel to change
          </p>
          <div className="flex items-center gap-8">
            <ColorWheel
              value={theme.primary}
              onChange={theme.setPrimary}
              label="Primary"
            />
            <ColorWheel
              value={theme.alt}
              onChange={theme.setAlt}
              label="Secondary"
            />

            {/* Live preview swatches */}
            <div className="flex-1 flex flex-col gap-2 ml-2">
              <div className="flex gap-1.5">
                {['--color-accent', '--color-accent-soft', '--color-accent-muted', '--color-green', '--color-border'].map(v => (
                  <div key={v} className="flex-1 h-5 rounded-full" style={{ background: `var(${v})` }} />
                ))}
              </div>
              <div className="flex gap-1.5">
                {['--color-bg', '--color-surface', '--color-bg-card', '--color-text-muted', '--color-text'].map(v => (
                  <div key={v} className="flex-1 h-5 rounded-full border" style={{ background: `var(${v})`, borderColor: 'var(--color-border)' }} />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={theme.reset}
            className="mt-4 flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <RotateCcw size={12} />
            Reset to defaults
          </button>
        </div>
      </section>

      {/* Unit system */}
      <section className="rounded-2xl border overflow-hidden" style={card}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Preferred Units</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Recipes auto-convert on import. Toggle per-recipe any time.
          </p>
        </div>
        <div className="flex p-3 gap-3">
          <button
            onClick={() => setUnit('metric')}
            className="flex-1 py-4 rounded-xl border-2 font-semibold text-sm transition-colors"
            style={isMetric
              ? { borderColor: 'var(--color-green)', background: 'color-mix(in srgb, var(--color-green) 15%, transparent)', color: 'var(--color-green)' }
              : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <div className="text-xl mb-1">g / ml / °C</div>
            <div className="text-xs font-normal">Metric</div>
          </button>
          <button
            onClick={() => setUnit('imperial')}
            className="flex-1 py-4 rounded-xl border-2 font-semibold text-sm transition-colors"
            style={!isMetric
              ? { borderColor: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }
              : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <div className="text-xl mb-1">oz / cup / °F</div>
            <div className="text-xs font-normal">Imperial</div>
          </button>
        </div>
      </section>

      {/* About */}
      <section className="rounded-2xl border overflow-hidden" style={card}>
        <div className="px-4 py-3">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Recipe Hub</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Your personal recipe collection — import from any URL, photo, or paste, with automatic unit conversion.
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--color-border)' }}>v1.0.0</p>
        </div>
      </section>
    </div>
  )
}
