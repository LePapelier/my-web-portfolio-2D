import { useState } from 'react'
import { isSoundEnabled, setSoundEnabled } from '../lib/sound'
import { copy } from '../graph/content'
import { SoundIcon } from './Icons'

/** Top right: the sounds, on or off. The theme follows the system. */
export default function Toolbar() {
  const [soundOn, setSoundOn] = useState(isSoundEnabled)
  const text = copy.en
  const label = soundOn ? text.soundOff : text.soundOn

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
  }

  return (
    <div className="toolbar">
      <button type="button" onClick={toggleSound} aria-label={label} title={label} className={soundOn ? undefined : 'is-off'}>
        <SoundIcon muted={!soundOn} />
      </button>
    </div>
  )
}
