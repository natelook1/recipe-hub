import { convertStepTemps } from '../../lib/units.js'

export default function StepList({ steps, system }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center"
            style={{ background: 'var(--color-accent)' }}>
            {i + 1}
          </span>
          <p className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--color-text)' }}>
            {convertStepTemps(step, system)}
          </p>
        </li>
      ))}
    </ol>
  )
}
