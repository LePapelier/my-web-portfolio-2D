/**
 * Shared types used across portfolio data files.
 * Keep this file free of any app-layer imports so the portfolio/ folder
 * remains a pure data layer with no circular dependencies.
 */

export type Language = 'en' | 'fr'

export interface CardPreviewImage {
  /**
   * Image path relative to the site root, without a leading slash
   * (e.g. `previews/paper-centurion.webp` for `public/previews/…`).
   */
  src: string
  /** Width ÷ height of the image — used to lay the card out before it loads. */
  aspectRatio: number
  /** Short description of the image, used by the hidden SEO layer. */
  alt: string
  /**
   * How bright the image should read inside the dark card, from 0 to 1.
   * The scene applies a bloom pass to anything brighter than a few percent of
   * luminance, so a light screenshot glows and washes out the text around it.
   * Leave it out for a dark image; lower it for a light one (0.55 suits a
   * screenshot of a white app).
   */
  brightness?: number
}

export interface CardLink {
  /** Destination opened in a new tab by the card's "open" button. */
  url: string
  /** Optional button label; defaults to "ouvrir ↗" / "open ↗". */
  label?: string
}

export interface CardContent {
  /** Name of the institution, company, or lab (optional). */
  institutionText?: string
  /** One-line summary shown on the collapsed card. */
  summaryText: string
  /** Markdown-style bullet list shown in the expanded card. */
  detailsText: string
  /** Optional preview thumbnail shown between the summary and the details. */
  previewImage?: CardPreviewImage
  /** Optional call-to-action button rendered at the bottom of the card. */
  link?: CardLink
}
