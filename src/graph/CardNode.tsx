import { memo, useMemo } from 'react'
import type { MouseEvent } from 'react'
import type { CardContent } from '../../portfolio/types'
import type { Language } from '../store/graph/types'
import { playSound } from '../lib/sound'
import { copy, parseDetails, resolveAssetPath } from './content'
import type { LabelPicture } from './content'
import { ChevronIcon, FocusIcon } from '../components/Icons'
import Picture from './Picture'

/** Card width at zoom 1, in pixels: closed, and open as the text grows. */
const CARD_CLOSED_WIDTH = 170
const CARD_OPEN_BASE_WIDTH = 260
const CARD_OPEN_MAX_WIDTH = 340
const CARD_WIDTH_PER_CHAR = 0.7

interface CardNodeProps {
  id: string
  label: string
  picture: LabelPicture | null
  content: CardContent
  language: Language
  isOpen: boolean
  isFocused: boolean
  onToggle: () => void
  onToggleFocus: (id: string) => void
}

/**
 * A leaf with something to say: its title above, and a panel with a one-line
 * summary that unfolds, on a click, into a picture, a few bullets and a link.
 */
function CardNode({ id, label, picture, content, language, isOpen, isFocused, onToggle, onToggleFocus }: CardNodeProps) {
  const text = copy[language]
  const lines = useMemo(() => parseDetails(content.detailsText ?? ''), [content.detailsText])
  const longest = Math.max(
    content.summaryText.length,
    ...lines.map((segments) => segments.reduce((length, segment) => length + segment.text.length, 0)),
  )
  const openWidth = Math.min(CARD_OPEN_BASE_WIDTH + longest * CARD_WIDTH_PER_CHAR, CARD_OPEN_MAX_WIDTH)
  const preview = content.previewImage

  const onLinkClick = (event: MouseEvent) => {
    event.stopPropagation()
    playSound('link')
  }

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
          <p className="card-summary">{content.summaryText}</p>
          <span className="card-chip">
            {text.details}
            <ChevronIcon />
          </span>
        </button>

        <div className="card-details" inert={!isOpen}>
          <div>
            <div className="card-details-inner">
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
                      {segments.map((segment, segmentIndex) =>
                        segment.url ? (
                          <a key={segmentIndex} href={segment.url} target="_blank" rel="noopener noreferrer" onClick={onLinkClick}>
                            {segment.text}
                          </a>
                        ) : (
                          <span key={segmentIndex}>{segment.text}</span>
                        ),
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {content.link && (
                <a className="card-open" href={content.link.url} target="_blank" rel="noopener noreferrer" onClick={onLinkClick}>
                  {content.link.label ?? text.open}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <button
          type="button"
          className="card-focus"
          aria-label={isFocused ? text.unfocus : text.focus}
          title={isFocused ? text.unfocus : text.focus}
          onClick={(event) => {
            event.stopPropagation()
            onToggleFocus(id)
          }}
        >
          <FocusIcon focused={isFocused} />
        </button>
      )}
    </div>
  )
}

export default memo(CardNode)
