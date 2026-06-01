import { updateSettings } from '../../api.js'
import { useRecipes } from '../../context/RecipeContext.jsx'
import { showToast } from '../layout/Toast.jsx'

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
      <h1 className="text-2xl font-bold text-[#2c1a0e]" style={{ fontFamily: "'Playfair Display', serif" }}>
        Settings
      </h1>

      {/* Unit system */}
      <section className="bg-white rounded-2xl border border-[#e8ddd0] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#f5f0e8]">
          <h2 className="font-semibold text-sm text-[#2c1a0e]">Preferred Units</h2>
          <p className="text-xs text-[#8a6a50] mt-0.5">
            New recipes will be converted to your preferred system on import. You can always toggle per-recipe.
          </p>
        </div>
        <div className="flex p-3 gap-3">
          <button
            onClick={() => setUnit('metric')}
            className={`flex-1 py-4 rounded-xl border-2 font-semibold text-sm transition-colors ${
              isMetric
                ? 'border-[#4a7c59] bg-[#4a7c59]/10 text-[#4a7c59]'
                : 'border-[#e8ddd0] text-[#8a6a50] hover:border-[#c2692f]'
            }`}
          >
            <div className="text-xl mb-1">g / ml / °C</div>
            <div className="text-xs font-normal">Metric</div>
          </button>
          <button
            onClick={() => setUnit('imperial')}
            className={`flex-1 py-4 rounded-xl border-2 font-semibold text-sm transition-colors ${
              !isMetric
                ? 'border-[#c2692f] bg-[#c2692f]/10 text-[#c2692f]'
                : 'border-[#e8ddd0] text-[#8a6a50] hover:border-[#c2692f]'
            }`}
          >
            <div className="text-xl mb-1">oz / cup / °F</div>
            <div className="text-xs font-normal">Imperial</div>
          </button>
        </div>
      </section>

      {/* About */}
      <section className="bg-white rounded-2xl border border-[#e8ddd0] overflow-hidden">
        <div className="px-4 py-3">
          <h2 className="font-semibold text-sm text-[#2c1a0e]">Recipe Hub</h2>
          <p className="text-xs text-[#8a6a50] mt-1">
            Your personal recipe collection — import from any URL, photo, or paste, with automatic unit conversion.
          </p>
          <p className="text-xs text-[#e8ddd0] mt-2">v1.0.0</p>
        </div>
      </section>
    </div>
  )
}
