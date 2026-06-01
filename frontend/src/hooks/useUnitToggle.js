import { useState } from 'react'

export function useUnitToggle(preferredSystem = 'metric') {
  const [system, setSystem] = useState(preferredSystem)
  const toggle = () => setSystem(s => s === 'metric' ? 'imperial' : 'metric')
  return { system, toggle, isMetric: system === 'metric' }
}
