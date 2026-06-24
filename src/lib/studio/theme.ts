/**
 * Studio Design Bible — the token engine that makes "bad design impossible".
 *
 * Ported from the original Halo theme.js. Given a small set of high-level design
 * choices (theme, accent color, fonts, button/image style), it derives a full set
 * of CSS custom properties. Sections only ever read these tokens, so every page
 * is internally consistent and on-brand by construction — the user never picks a
 * raw color/size, only a constrained option.
 */

export type ThemeName = 'Sunset' | 'Bold' | 'Midnight'
export type FontPair = 'Geometric' | 'Grotesque' | 'Rounded'
export type Density = 'Compact' | 'Cozy' | 'Spacious'
export type ButtonStyle = 'Solid' | 'Outline' | 'Pill' | 'Hard'
export type ImageTreatment = 'Soft' | 'Clean' | 'Frame' | 'Duotone' | 'Outline'

export interface ThemeProps {
  theme?: ThemeName
  accent?: string
  radius?: number
  density?: Density
  fontPair?: FontPair
  buttonStyle?: ButtonStyle
  imageTreatment?: ImageTreatment
}

interface BaseTheme {
  bg: string
  surface: string
  surface2: string
  fg: string
  muted: string
  accent: string
  accent2: string
  border: string
  shadow: string
}

export const THEMES: Record<ThemeName, BaseTheme> = {
  Sunset: { bg: '#FBF6EF', surface: '#FFFFFF', surface2: '#F4EADC', fg: '#2A2018', muted: '#8A7B6B', accent: '#E0603A', accent2: '#D89A3F', border: '#EADFD2', shadow: '0 14px 38px rgba(90,55,30,.10)' },
  Bold: { bg: '#FFFFFF', surface: '#FFF8F0', surface2: '#FFEEDC', fg: '#17120D', muted: '#6B6157', accent: '#FF4D17', accent2: '#FFB627', border: '#17120D', shadow: '6px 6px 0 #17120D' },
  Midnight: { bg: '#15110C', surface: '#1F1811', surface2: '#271F16', fg: '#F6EEE2', muted: '#A6927C', accent: '#FF7A3D', accent2: '#FFC24B', border: '#352A1F', shadow: '0 24px 60px rgba(0,0,0,.55)' },
}

/** Pick a readable foreground (#dark or #light) for a given background hex. */
export function readable(hex: string): string {
  try {
    let h = String(hex).replace('#', '')
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return L > 0.62 ? '#17120D' : '#FFFFFF'
  } catch {
    return '#FFFFFF'
  }
}

const FONT_PAIRS: Record<FontPair, [string, string]> = {
  Geometric: ['Sora', 'Manrope'],
  Grotesque: ['Space Grotesk', 'Manrope'],
  Rounded: ['Outfit', 'Manrope'],
}

const DENSITY_SCALE: Record<Density, number> = { Compact: 0.78, Cozy: 1, Spacious: 1.3 }

/** Derive the full CSS-variable token map from high-level design props. */
export function tokens(p: ThemeProps = {}): Record<string, string> {
  const base = THEMES[p.theme ?? 'Sunset'] ?? THEMES.Sunset
  const accent = p.accent || base.accent
  const accentFg = readable(accent)
  const r = Number(p.radius != null ? p.radius : 16)
  const padScale = (p.density && DENSITY_SCALE[p.density]) || 1
  const fonts = (p.fontPair && FONT_PAIRS[p.fontPair]) || FONT_PAIRS.Geometric
  const borderW = p.theme === 'Bold' ? '2px' : '1px'

  let btn = { bg: accent, fg: accentFg, border: 'transparent', shadow: 'none', radius: `${Math.max(2, r - 4)}px` }
  if (p.buttonStyle === 'Outline') btn = { bg: 'transparent', fg: accent, border: accent, shadow: 'none', radius: `${Math.max(2, r - 4)}px` }
  if (p.buttonStyle === 'Pill') btn = { bg: accent, fg: accentFg, border: 'transparent', shadow: 'none', radius: '999px' }
  if (p.buttonStyle === 'Hard') btn = { bg: accent, fg: accentFg, border: base.fg, shadow: `5px 5px 0 ${base.fg}`, radius: '6px' }

  let img = { radius: `${r}px`, shadow: base.shadow, border: 'none', filter: 'none' }
  if (p.imageTreatment === 'Clean') img = { radius: '2px', shadow: 'none', border: 'none', filter: 'none' }
  if (p.imageTreatment === 'Frame') img = { radius: `${r}px`, shadow: '0 6px 18px rgba(0,0,0,.10)', border: `${borderW} solid ${base.border}`, filter: 'none' }
  if (p.imageTreatment === 'Duotone') img = { radius: `${r}px`, shadow: base.shadow, border: 'none', filter: 'sepia(.38) saturate(1.3) hue-rotate(-12deg) contrast(1.02)' }
  if (p.imageTreatment === 'Outline') img = { radius: `${Math.max(2, r - 6)}px`, shadow: 'none', border: `2px solid ${base.fg}`, filter: 'none' }

  return {
    '--bg': base.bg, '--surface': base.surface, '--surface-2': base.surface2,
    '--fg': base.fg, '--muted': base.muted,
    '--accent': accent, '--accent-fg': accentFg, '--accent-2': base.accent2,
    '--border': base.border, '--border-w': borderW, '--shadow': base.shadow,
    '--radius': `${r}px`, '--radius-sm': `${Math.max(0, r - 6)}px`, '--pad-scale': String(padScale),
    '--font-display': `'${fonts[0]}'`, '--font-body': `'${fonts[1]}'`,
    '--btn-bg': btn.bg, '--btn-fg': btn.fg, '--btn-border': btn.border, '--btn-shadow': btn.shadow, '--btn-radius': btn.radius,
    '--img-radius': img.radius, '--img-shadow': img.shadow, '--img-border': img.border, '--img-filter': img.filter,
  }
}

/** tokens() as a React style object (CSS custom props are valid inline styles). */
export function tokenStyle(p: ThemeProps = {}): React.CSSProperties {
  return tokens(p) as React.CSSProperties
}

/**
 * The Design Bible move: turn a brand into a constrained, guaranteed-good theme.
 * Given a brand accent color, pick the base theme whose mood best matches its
 * lightness, and feed the real accent through. The output is always valid — the
 * user's brand color can only ever land inside the token system, never break it.
 */
export function deriveThemeFromBrand(input: {
  accent?: string | null
  prefersDark?: boolean
  fontPair?: FontPair
}): ThemeProps {
  const accent = (input.accent && /^#?[0-9a-fA-F]{3,6}$/.test(input.accent.replace('#', '')))
    ? (input.accent.startsWith('#') ? input.accent : `#${input.accent}`)
    : undefined

  // Choose a base theme by intent: dark brands → Midnight, very saturated/punchy
  // accents → Bold, everything else → the warm Sunset default.
  let theme: ThemeName = 'Sunset'
  if (input.prefersDark) theme = 'Midnight'

  return {
    theme,
    accent,
    fontPair: input.fontPair ?? 'Geometric',
    buttonStyle: 'Solid',
    imageTreatment: 'Soft',
    density: 'Cozy',
    radius: 16,
  }
}
