/**
 * SeoContent — a visually-hidden HTML overlay that gives search-engine
 * crawlers indexable text of your entire portfolio without touching the
 * graph.
 *
 * Technique: the "visually-hidden" CSS pattern (1 × 1 px clipped box).
 * The wrapper is marked aria-hidden so assistive technologies skip it and
 * only encounter the live graph.
 *
 * Both language variants (EN + FR) are rendered with explicit lang attributes
 * so crawlers can index the content in the correct language for each audience.
 *
 * Data is pulled directly from the portfolio/ data layer so it always stays
 * in sync with what is displayed in the graph.
 */

import { fullName, jobTitle, seoDescription } from '../../portfolio/seo'
import { cardContentEn } from '../../portfolio/cards/en'
import { cardContentFr } from '../../portfolio/cards/fr'
import { nodeLabels, nodeSubtitles } from '../../portfolio/nodes/labels'
import { graphStructure } from '../../portfolio/nodes/structure'
import { githubUrl } from '../../portfolio/identity'

// Derive item keys from the actual card data so this list never goes out of
// sync with the content layer — adding a new project/exp/diploma entry to the
// card files automatically includes it here.
const KEY_PREFIX_PROJECT = 'project-'
const KEY_PREFIX_CENTURION = 'centurion-'
const KEY_PREFIX_EXP = 'exp-'
const KEY_PREFIX_DIPLOMA = 'diploma-'
// The PhD sits in the background section alongside the diplomas.
const KEY_PHD = 'phd'

// Only what the graph actually shows: a card kept aside for later stays out
// of the indexed text too.
const shownKeys = new Set(Object.values(graphStructure).flatMap((children) => children.map(({ key }) => key)))
const projectKeys = Object.keys(cardContentEn).filter(
  (k) => shownKeys.has(k) && (k.startsWith(KEY_PREFIX_PROJECT) || k.startsWith(KEY_PREFIX_CENTURION)),
)
const expKeys = Object.keys(cardContentEn).filter((k) => k.startsWith(KEY_PREFIX_EXP))
const diplomaKeys = [
  ...(KEY_PHD in cardContentEn ? [KEY_PHD] : []),
  ...Object.keys(cardContentEn).filter((k) => k.startsWith(KEY_PREFIX_DIPLOMA)),
]

const cardContent = { en: cardContentEn, fr: cardContentFr }
type Lang = 'en' | 'fr'

function LangSection({ lang }: { lang: Lang }) {
  const labels = nodeLabels[lang]
  const cards = cardContent[lang]

  return (
    <div lang={lang}>
      {/* ── Identity ── */}
      <h1>
        {fullName}, {jobTitle}
      </h1>
      <p>{seoDescription}</p>

      {/* ── Projects ── */}
      <section>
        <h2>{labels.projects}</h2>
        <ul>
          {projectKeys.map((key) => {
            const label = labels[key] ?? key
            const card = cards[key]
            return (
              <li key={key}>
                <h3>{label}</h3>
                {card && <p>{card.summaryText}</p>}
                {card?.detailsText && <p>{card.detailsText}</p>}
                {card?.previewImage && <p>{card.previewImage.alt}</p>}
                {card?.link && <a href={card.link.url}>{label}</a>}
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── Experience ── */}
      <section>
        <h2>{labels.experience}</h2>
        <ul>
          {expKeys.map((key) => {
            const label = labels[key] ?? key
            const card = cards[key]
            return (
              <li key={key}>
                <h3>{label}</h3>
                {card?.institutionText && <p>{card.institutionText}</p>}
                {card && <p>{card.summaryText}</p>}
                {card?.detailsText && <p>{card.detailsText}</p>}
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── Education / Background ── */}
      {/* Diplomas live under the "about-story" node of the graph */}
      <section>
        <h2>{labels['about-story']}</h2>
        <ul>
          {diplomaKeys.map((key) => {
            const label = labels[key] ?? key
            const card = cards[key]
            return (
              <li key={key}>
                <h3>{label}</h3>
                {card?.institutionText && <p>{card.institutionText}</p>}
                {card && <p>{card.summaryText}</p>}
                {card?.detailsText && <p>{card.detailsText}</p>}
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── Profile ── */}
      <section>
        <h2>{labels.about}</h2>
        <p>{labels['about-location']}</p>
        {graphStructure.teaching && (
          <p>
            {labels.teaching} ({nodeSubtitles[lang].teaching}):{' '}
            {graphStructure.teaching.map(({ key }) => labels[key]).join(', ')}
          </p>
        )}
      </section>

      {/* ── Contact ── */}
      <section>
        <h2>{labels.mail}</h2>
        <p>
          <a href={githubUrl}>GitHub</a>
        </p>
      </section>
    </div>
  )
}

export default function SeoContent() {
  return (
    <div className="visually-hidden" aria-hidden="true">
      <LangSection lang="en" />
      <LangSection lang="fr" />
    </div>
  )
}
