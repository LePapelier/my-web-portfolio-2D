import { memo, useMemo } from 'react'
import type { MouseEvent } from 'react'
import type { CardContent } from '../../portfolio/types'
import type { Language } from '../store/graph/types'
import { copy, parseDetails, resolveAssetPath } from './content'
import type { DetailsSegment, LabelPicture } from './content'
import { ChevronIcon } from '../components/Icons'
import Picture from './Picture'
import { useTypewriter } from './useTypewriter'

/** Card width at zoom 1, in pixels: as a closed pill, and open, growing a little with the text. */
const CARD_CLOSED_WIDTH = 100
const CARD_OPEN_BASE_WIDTH = 260
const CARD_OPEN_MAX_WIDTH = 340
const CARD_WIDTH_PER_CHAR = 0.7
/** Milliseconds the typing waits for the panel to unfold first. */
const TYPING_DELAY_MS = 220

interface CardNodeProps {
  label: string
  picture: LabelPicture | null
  content: CardContent
  language: Language
  isOpen: boolean
  onToggle: () => void
}

/** The first `count` characters of a line, link by link. */
function typedSegments(segments: DetailsSegment[], count: number): DetailsSegment[] {
  const typed: DetailsSegment[] = []
  let remaining = count
  for (const segment of segments) {
    if (remaining <= 0) break
    const chars = Array.from(segment.text)
    typed.push({ ...segment, text: chars.slice(0, remaining).join('') })
    remaining -= chars.length
  }
  return typed
}

/**
 * A leaf with something to say: its title, and under it a "details" pill
 * that widens, on a click, into a panel where the summary, a picture, a few
 * bullets and a link unfold, the text typed out as on a keyboard.
 */
function CardNode({ label, picture, content, language, isOpen, onToggle }: CardNodeProps) {
  const text = copy[language]
  const lines = useMemo(() => parseDetails(content.detailsText ?? ''), [content.detailsText])
  // Everything typed, in order: the summary, then each bullet.
  const paragraphs = useMemo<DetailsSegment[][]>(() => [[{ text: content.summaryText }], ...lines], [content.summaryText, lines])
  const typedText = useMemo(
    () => paragraphs.map((segments) => segments.map((segment) => segment.text).join('')).join('\n'),
    [paragraphs],
  )
  const typedCount = useTypewriter(typedText, isOpen, TYPING_DELAY_MS)

  const longest = Math.max(
    ...paragraphs.map((segments) => segments.reduce((length, segment) => length + Array.from(segment.text).length, 0)),
  )
  const openWidth = Math.min(CARD_OPEN_BASE_WIDTH + longest * CARD_WIDTH_PER_CHAR, CARD_OPEN_MAX_WIDTH)
  const preview = content.previewImage

  // Each paragraph gets what is left of the typed characters, the newline
  // between two paragraphs counting for one.
  let remaining = typedCount
  const typedParagraphs = paragraphs.map((segments) => {
    const length = segments.reduce((sum, segment) => sum + Array.from(segment.text).length, 0)
    const typed = typedSegments(segments, Math.max(0, remaining))
    remaining -= length + 1
    return typed
  })
  const [typedSummary, ...typedLines] = typedParagraphs
  const isTyped = typedCount >= Array.from(typedText).length

  const onLinkClick = (event: MouseEvent) => event.stopPropagation()

  const renderSegments = (segments: DetailsSegment[]) =>
    segments.map((segment, index) =>
      segment.url ? (
        <a key={index} href={segment.url} target="_blank" rel="noopener noreferrer" onClick={onLinkClick}>
          {segment.text}
        </a>
      ) : (
        <span key={index}>{segment.text}</span>
      ),
    )

  return (
    <div className={`card-node${isOpen ? ' is-open' : ''}`}>
      <div className="card-head">
        {content.institutionText && <span className="subtitle">{content.institutionText}</span>}
        <span className="title">
          <Picture picture={picture} />
          {label}
        </span>
      </div>

      <div className={`card${isOpen ? ' is-open' : ''}`} style={{ width: isOpen ? openWidth : CARD_CLOSED_WIDTH }}>
        <button type="button" className="card-toggle" aria-expanded={isOpen} onClick={onToggle}>
          <span className="card-chip">
            {text.details}
            <ChevronIcon />
          </span>
        </button>

        <div className="card-details" inert={!isOpen}>
          <div>
            <div className="card-body">
              {/* The full text sits underneath, invisible, so the panel has its final
                  height from the start and nothing shifts while the words arrive. */}
              <p className="card-summary">
                <span className="typed-ghost" aria-hidden="true">
                  {content.summaryText}
                </span>
                <span className="typed">{renderSegments(typedSummary)}</span>
              </p>
              {preview && (
                <img
                  className="card-preview"
                  src={resolveAssetPath(preview.src)}
                  alt={preview.alt}
                  style={{ aspectRatio: preview.aspectRatio }}
                  loading="lazy"
                  draggable={false}
                />
              )}
              {lines.length > 0 && (
                <ul className="card-list">
                  {lines.map((segments, index) => (
                    <li key={index}>
                      <span className="typed-ghost" aria-hidden="true">
                        {segments.map((segment) => segment.text).join('')}
                      </span>
                      <span className="typed">{renderSegments(typedLines[index] ?? [])}</span>
                    </li>
                  ))}
                </ul>
              )}
              {content.link && (
                <a
                  className={`card-open${isTyped ? ' is-ready' : ''}`}
                  href={content.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onLinkClick}
                >
                  {content.link.label ?? text.open}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default memo(CardNode)
