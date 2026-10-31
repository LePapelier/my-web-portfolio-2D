/** The small line icons of the interface, all drawn in the current colour. */

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Speaker, struck through when the interface sounds are muted. */
export function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...strokeProps} aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {muted ? (
        <>
          <path d="m16 9 5 6" />
          <path d="m21 9-5 6" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  )
}

/** A sun for the light theme, a crescent for the dark one. */
export function ThemeIcon({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...strokeProps} aria-hidden="true">
      {theme === 'light' ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </>
      ) : (
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      )}
    </svg>
  )
}

/** The GitHub mark, from github-label.svg of the 3D site. */
export function GithubMark() {
  return (
    <svg className="github-mark" viewBox="9 10 79 78" aria-hidden="true">
      <path d="M48 10C26.46 10 9 27.46 9 49c0 17.23 11.18 31.86 26.68 37.02 1.95.37 2.66-.84 2.66-1.87 0-.92-.03-3.36-.05-6.6-10.85 2.36-13.14-5.23-13.14-5.23-1.78-4.52-4.35-5.72-4.35-5.72-3.56-2.44.27-2.39.27-2.39 3.94.28 6.01 4.05 6.01 4.05 3.5 6 9.18 4.27 11.42 3.27.35-2.54 1.37-4.27 2.49-5.25-8.66-.99-17.77-4.33-17.77-19.25 0-4.25 1.52-7.72 4.02-10.44-.4-.99-1.74-4.98.38-10.38 0 0 3.28-1.05 10.75 4.01A37.49 37.49 0 0 1 48 31.94c3.32.02 6.66.45 9.79 1.31 7.47-5.06 10.74-4.01 10.74-4.01 2.12 5.4.79 9.39.39 10.38 2.5 2.72 4.01 6.19 4.01 10.44 0 14.96-9.12 18.25-17.8 19.22 1.4 1.21 2.65 3.6 2.65 7.26 0 5.25-.05 9.48-.05 10.77 0 1.03.7 2.26 2.68 1.87C76.84 80.83 88 66.22 88 49c0-21.54-17.46-39-39-39z" />
    </svg>
  )
}

/** Four corner brackets to enlarge a card, a chevron to come back. */
export function FocusIcon({ focused }: { focused: boolean }) {
  return focused ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 5-7 7 7 7" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" />
    </svg>
  )
}

/** The chevron of the "details" chip. */
export function ChevronIcon() {
  return (
    <svg viewBox="0 0 8 5" aria-hidden="true">
      <path d="M1 1l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
