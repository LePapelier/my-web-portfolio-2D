/**
 * Light or dark: white page with black ink, or black page with white ink,
 * following the system setting, and following it if it changes. A small
 * script in index.html applies the same rule before the first paint.
 */

export type Theme = 'light' | 'dark'

const THEME_COLOR: Record<Theme, string> = { light: '#ffffff', dark: '#000000' }

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return systemTheme()
}

/** Applies a theme to the document: the stylesheet keys on the attribute. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => (meta.content = THEME_COLOR[theme]))
}

/** Follows the system setting; returns the function that stops following. */
export function followSystemTheme(onChange: (theme: Theme) => void): () => void {
  const query = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (!query) return () => {}
  const listener = (event: MediaQueryListEvent) => onChange(event.matches ? 'dark' : 'light')
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}
