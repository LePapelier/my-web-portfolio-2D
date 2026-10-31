import { useState } from 'react'
import { useGraphStore } from '../store/useGraphStore'
import { isSoundEnabled, setSoundEnabled } from '../lib/sound'
import type { Theme } from '../lib/theme'
import { copy } from '../graph/content'
import { SoundIcon, ThemeIcon } from './Icons'

interface ToolbarProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

/** Top right: the language, the sounds, and the theme. */
export default function Toolbar({ theme, onThemeChange }: ToolbarProps) {
  const language = useGraphStore((state) => state.language)
  const setLanguage = useGraphStore((state) => state.setLanguage)
  const [soundOn, setSoundOn] = useState(isSoundEnabled)
  const text = copy[language]

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
  }

  const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
  const themeLabel = nextTheme === 'light' ? text.lightTheme : text.darkTheme
  const soundLabel = soundOn ? text.soundOff : text.soundOn

  return (
    <div className="toolbar">
      <button type="button" onClick={() => setLanguage('en')} aria-label={text.switchToEnglish} aria-pressed={language === 'en'}>
        EN
      </button>
      <button type="button" onClick={() => setLanguage('fr')} aria-label={text.switchToFrench} aria-pressed={language === 'fr'}>
        FR
      </button>
      <span className="separator" aria-hidden="true" />
      <button type="button" onClick={toggleSound} aria-label={soundLabel} title={soundLabel} className={soundOn ? undefined : 'is-off'}>
        <SoundIcon muted={!soundOn} />
      </button>
      <button type="button" onClick={() => onThemeChange(nextTheme)} aria-label={themeLabel} title={themeLabel}>
        <ThemeIcon theme={theme} />
      </button>
    </div>
  )
}
