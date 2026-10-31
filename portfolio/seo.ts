/**
 * SEO metadata — update these values to improve your portfolio's
 * visibility in search engines.
 *
 * These values are used in:
 *  - The <head> meta tags (title, description, theme-color, hreflang)
 *  - The Open Graph / Twitter Card meta tags
 *  - The JSON-LD structured data (schema.org/Person)
 *  - The Web App Manifest (manifest.webmanifest)
 *  - The sitemap.xml (auto-generated at build time)
 *  - The hidden HTML content layer read by crawlers
 */

import { fullName, siteUrl, githubUrl } from './identity'

/**
 * The name as people type it into a search engine. The graph shows it in
 * capitals (`fullName`); search results and structured data use this form,
 * and give the other as an alternate name.
 */
export const searchName = 'Paul Laurent'

/** Your job title shown in the page title, descriptions and structured data. */
export const jobTitle = 'CNRS PhD student in formal verification'

/**
 * A concise description of your portfolio shown in search-result snippets
 * and social-media previews (aim for 120–160 characters).
 */
export const seoDescription = `${searchName}, CNRS PhD student at IRISA, Rennes: formal verification of cryptographic protocols with ProVerif. Thesis, background and projects.`

/**
 * Comma-separated keywords that describe your work.
 * Keep the list focused; 5-10 relevant terms is plenty.
 */
export const seoKeywords = [
  searchName,
  'PhD student',
  'CNRS',
  'IRISA',
  'formal verification',
  'cryptographic protocols',
  'ProVerif',
  'cybersecurity',
  'Rennes',
]

/** The employer named in the structured data. */
export const affiliation = { name: 'CNRS', url: 'https://www.cnrs.fr' }

/**
 * Everywhere the structured data says you belong: the employer, the lab the
 * thesis is done in, and the university where you teach.
 */
export const affiliations = [
  affiliation,
  { name: 'IRISA', url: 'https://www.irisa.fr' },
  { name: 'Université de Rennes', url: 'https://www.univ-rennes.fr' },
]

/** Schools named in the structured data, as `alumniOf`. */
export const alumniOf = [
  { name: 'INSA Centre Val de Loire', url: 'https://www.insa-centrevaldeloire.fr' },
  { name: 'INSA Rennes', url: 'https://www.insa-rennes.fr' },
]

/** Research topics named in the structured data, as `knowsAbout`. */
export const knowsAbout = [
  'Formal verification',
  'Cryptographic protocols',
  'ProVerif',
  'Cybersecurity',
  'Attack trees',
  'Equational theories',
  'Formal logic',
]

/** Where you are based, for the structured data. */
export const addressLocality = 'Rennes'
export const addressCountry = 'FR'

/**
 * URL of a social-preview image (1200 × 630 px recommended).
 * Place the image in /public and update the path, or use an absolute URL.
 * Leave as an empty string if you don't have one yet.
 */
export const ogImageUrl = `${siteUrl}/my-web-portfolio-2D/og-image.png`

/**
 * Your Twitter / X handle (without the @), used for Twitter Card meta tags.
 * Leave as an empty string if you don't have one or don't want to use it.
 */
export const twitterHandle = ''

/**
 * Your LinkedIn profile URL, used in JSON-LD sameAs links.
 * Example: 'https://www.linkedin.com/in/your-profile'
 * Leave as an empty string if you don't have one or don't want to use it.
 */
export const linkedinUrl = 'https://www.linkedin.com/in/paul-laurent-46841b43b/'

/**
 * The primary brand colour used in:
 *  - <meta name="theme-color"> (mobile browser toolbar)
 *  - The Web App Manifest theme/background colour
 * Should match your app's background.  The 2D site is black and white: black, the dark theme's background.
 */
export const themeColor = '#000000'

// Re-export shared identity so consumers only need one import
export { fullName, siteUrl, githubUrl }
