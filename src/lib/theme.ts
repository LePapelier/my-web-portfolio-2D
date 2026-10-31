/**
 * Light or dark: white page with black ink, or black page with white ink.
 *
 * The visitor's choice is kept in local storage; without one, the system
 * setting decides, and the page follows it if it changes. A small script in
 * index.html applies the same rule before the first paint.
 */

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'portfolio-theme'
const THEME_COLOR: Record<Theme, string> = { light: '#ffffff', dark: '#000000' }

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isTheme(stored) ? stored : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return readStoredTheme() ?? systemTheme()
}

/** Applies a theme to the document: the stylesheet keys on the attribute. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => (meta.content = THEME_COLOR[theme]))
}

export function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // The choice just won't stick between visits.
  }
}

/**
 * Follows the system setting while the visitor has not chosen; returns the
 * function that stops following.
 */
export function followSystemTheme(onChange: (theme: Theme) => void): () => void {
  const query = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (!query) return () => {}
  const listener = (event: MediaQueryListEvent) => {
    if (readStoredTheme() === null) onChange(event.matches ? 'dark' : 'light')
  }
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}
