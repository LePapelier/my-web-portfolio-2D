import { useEffect, useState } from 'react'
import { useGraphStore } from './store/useGraphStore'
import { applyTheme, followSystemTheme, getInitialTheme, storeTheme } from './lib/theme'
import type { Theme } from './lib/theme'
import SeoContent from './components/SeoContent'
import Toolbar from './components/Toolbar'
import GraphView from './graph/GraphView'

export default function App() {
  const language = useGraphStore((state) => state.language)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Keep the <html lang> attribute in sync with the selected language so that
  // search engines and assistive technologies always see the correct language.
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => followSystemTheme(setTheme), [])

  const chooseTheme = (next: Theme) => {
    storeTheme(next)
    setTheme(next)
  }

  return (
    <div className="app">
      {/* Visually-hidden HTML content for search-engine indexing */}
      <SeoContent />
      <Toolbar theme={theme} onThemeChange={chooseTheme} />
      <GraphView />
    </div>
  )
}
