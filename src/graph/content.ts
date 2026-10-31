/**
 * What each node shows, read from the portfolio data layer: card contents,
 * pictograms, subtitles, where a leaf leads, and the wording of the small
 * calls to action.
 */
import type { Language } from '../store/graph/types'
import type { CardContent } from '../../portfolio/types'
import { cardContentEn } from '../../portfolio/cards/en'
import { cardContentFr } from '../../portfolio/cards/fr'
import { labelIconByTemplateKey } from '../../portfolio/nodes/icons'
import { nodeLookups, nodeSubtitles } from '../../portfolio/nodes/labels'

const cardContentByLanguage: Record<Language, Record<string, CardContent>> = {
  en: cardContentEn,
  fr: cardContentFr,
}

export function getCardContent(templateKey: string, language: Language): CardContent | undefined {
  return cardContentByLanguage[language][templateKey] ?? cardContentByLanguage.en[templateKey]
}

export function getNodeSubtitle(templateKey: string, language: Language): string | undefined {
  return nodeSubtitles[language][templateKey] ?? nodeSubtitles.en[templateKey]
}

/** The page a leaf's "fiche ↗" opens, when one was chosen for it. */
export function getNodeLookup(templateKey: string, language: Language): string | undefined {
  return nodeLookups[language][templateKey] ?? nodeLookups.en[templateKey]
}

/** A title's logo, ready to draw: see portfolio/nodes/icons.ts. */
export interface LabelPicture {
  url: string
  /** Width over height. */
  aspect: number
  /** Height as a fraction of the font size, when the default does not suit. */
  scale?: number
}

/**
 * Only the logos are shown here, in their own colours: the 3D site's line
 * pictograms (a Lucide icon name in the data) are left out of the 2D site.
 */
export function getLabelPicture(templateKey: string): LabelPicture | null {
  const icon = labelIconByTemplateKey[templateKey]
  if (!icon || typeof icon === 'string') return null
  return { url: resolveAssetPath(`icons/${icon.image}`), aspect: icon.aspect, scale: icon.scale }
}

/** Resolves a portfolio-relative asset path against the app's base URL. */
export function resolveAssetPath(relativePath: string): string {
  return `${import.meta.env.BASE_URL}${relativePath.replace(/^\//, '')}`
}

export const emailPrivateSvgPath = resolveAssetPath('private-contact/email.svg')

export const copy = {
  fr: {
    details: 'détails',
    open: 'ouvrir ↗',
    sheet: 'fiche ↗',
    search: 'chercher ↗',
    startHint: 'Clique sur le cercle pour commencer...',
    switchToEnglish: 'Switch to English',
    switchToFrench: 'Basculer en français',
    lightTheme: 'Passer au thème clair',
    darkTheme: 'Passer au thème sombre',
    expand: 'Déplier',
    collapse: 'Replier',
    email: 'Adresse e-mail',
    emailMissing: 'adresse e-mail',
  },
  en: {
    details: 'details',
    open: 'open ↗',
    sheet: 'syllabus ↗',
    search: 'search ↗',
    startHint: 'Click the circle to start exploring...',
    switchToEnglish: 'Switch to English',
    switchToFrench: 'Basculer en français',
    lightTheme: 'Switch to the light theme',
    darkTheme: 'Switch to the dark theme',
    expand: 'Expand',
    collapse: 'Collapse',
    email: 'Email address',
    emailMissing: 'email address',
  },
} as const

/** A link in a card's details, written `[text](url)`. */
export interface DetailsSegment {
  text: string
  url?: string
}

/** Splits a markdown-style bullet list into lines of text and link segments. */
export function parseDetails(markdown: string): DetailsSegment[][] {
  return markdown
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)
    .map((line) => {
      const segments: DetailsSegment[] = []
      const pattern = /\[([^\]]+)\]\(([^)]+)\)/g
      let last = 0
      for (const match of line.matchAll(pattern)) {
        if (match.index > last) segments.push({ text: line.slice(last, match.index) })
        segments.push({ text: match[1], url: match[2] })
        last = match.index + match[0].length
      }
      if (last < line.length) segments.push({ text: line.slice(last) })
      return segments
    })
}
