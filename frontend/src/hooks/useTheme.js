import { useState, useEffect } from 'react'

// Convert hex to HSL components
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    return Math.round((l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) * 255)
      .toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function clamp(v, min, max) { return Math.min(Math.max(v, min), max) }

// Derive full palette from two picked colours + dark mode flag
function derivePalette(primaryHex, altHex, dark) {
  const [ph, ps, pl] = hexToHsl(primaryHex)
  const [ah, as_, al] = hexToHsl(altHex)

  if (dark) {
    return {
      '--color-bg':           hslToHex(ph, clamp(ps * 0.3, 5, 20), 8),
      '--color-bg-card':      hslToHex(ph, clamp(ps * 0.3, 5, 20), 12),
      '--color-surface':      hslToHex(ph, clamp(ps * 0.3, 5, 20), 16),
      '--color-accent':       hslToHex(ph, clamp(ps, 50, 90), clamp(pl + 10, 45, 65)),
      '--color-accent-soft':  hslToHex(ph, clamp(ps * 0.8, 40, 80), clamp(pl, 35, 55)),
      '--color-accent-muted': hslToHex(ph, clamp(ps * 0.4, 15, 40), 22),
      '--color-green':        hslToHex(ah, clamp(as_, 40, 80), clamp(al + 10, 40, 65)),
      '--color-text':         hslToHex(ph, clamp(ps * 0.2, 5, 15), 88),
      '--color-text-muted':   hslToHex(ph, clamp(ps * 0.25, 8, 25), 55),
      '--color-border':       hslToHex(ph, clamp(ps * 0.3, 8, 25), 20),
      '--color-nav-bg':       hslToHex(ph, clamp(ps * 0.3, 5, 20), 10),
      '--color-header-bg':    `hsla(${ph},${clamp(ps * 0.3, 5, 20)}%,8%,0.95)`,
    }
  } else {
    return {
      '--color-bg':           hslToHex(ph, clamp(ps * 0.15, 5, 20), 97),
      '--color-bg-card':      '#ffffff',
      '--color-surface':      hslToHex(ph, clamp(ps * 0.2, 8, 25), 93),
      '--color-accent':       hslToHex(ph, clamp(ps, 50, 85), clamp(pl, 35, 55)),
      '--color-accent-soft':  hslToHex(ph, clamp(ps * 0.8, 40, 75), clamp(pl + 15, 50, 68)),
      '--color-accent-muted': hslToHex(ph, clamp(ps * 0.4, 20, 50), 88),
      '--color-green':        hslToHex(ah, clamp(as_, 35, 70), clamp(al, 30, 50)),
      '--color-text':         hslToHex(ph, clamp(ps * 0.4, 15, 40), 12),
      '--color-text-muted':   hslToHex(ph, clamp(ps * 0.3, 10, 30), 42),
      '--color-border':       hslToHex(ph, clamp(ps * 0.2, 8, 25), 86),
      '--color-nav-bg':       '#ffffff',
      '--color-header-bg':    `hsla(${ph},${clamp(ps * 0.15, 5, 20)}%,97%,0.95)`,
    }
  }
}

const DEFAULTS = { primary: '#c2692f', alt: '#4a7c59' }

function loadSaved() {
  try {
    const s = localStorage.getItem('theme-colors')
    return s ? JSON.parse(s) : DEFAULTS
  } catch { return DEFAULTS }
}

function applyPalette(palette) {
  const root = document.documentElement
  Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v))
  // Keep browser chrome / status bar in sync with accent colour
  const metaTheme = document.querySelector('meta[name="theme-color"]')
  if (metaTheme) metaTheme.setAttribute('content', palette['--color-accent'] ?? '#6B3FA0')
}

export function useTheme(dark) {
  const [colors, setColors] = useState(loadSaved)

  useEffect(() => {
    const palette = derivePalette(colors.primary, colors.alt, dark)
    applyPalette(palette)
  }, [colors, dark])

  function setPrimary(hex) {
    const next = { ...colors, primary: hex }
    setColors(next)
    localStorage.setItem('theme-colors', JSON.stringify(next))
  }

  function setAlt(hex) {
    const next = { ...colors, alt: hex }
    setColors(next)
    localStorage.setItem('theme-colors', JSON.stringify(next))
  }

  function reset() {
    setColors(DEFAULTS)
    localStorage.setItem('theme-colors', JSON.stringify(DEFAULTS))
  }

  return { primary: colors.primary, alt: colors.alt, setPrimary, setAlt, reset }
}
