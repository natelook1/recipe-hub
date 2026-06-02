import { updateSettings } from '../../api.js'
import { useRecipes } from '../../context/RecipeContext.jsx'
import { showToast } from '../layout/Toast.jsx'

const card = { background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }

export default function SettingsPage() {
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

      {/* Unit system */}
      <section className="rounded-2xl border overflow-hidden" style={card}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Preferred Units</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            New recipes will be converted to your preferred system on import. You can always toggle per-recipe.
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
