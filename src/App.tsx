import { useEffect, useState } from 'react'
import { applyTheme, followSystemTheme, getInitialTheme } from './lib/theme'
import type { Theme } from './lib/theme'
import SeoContent from './components/SeoContent'
import GraphView from './graph/GraphView'

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => followSystemTheme(setTheme), [])

  return (
    <div className="app">
      {/* Visually-hidden HTML content for search-engine indexing */}
      <SeoContent />
      <GraphView />
    </div>
  )
}
