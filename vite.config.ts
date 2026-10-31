import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {
  fullName,
  siteUrl,
  githubUrl,
  jobTitle,
  seoDescription,
  seoKeywords,
  ogImageUrl,
  twitterHandle,
  linkedinUrl,
  themeColor,
  searchName,
  affiliation,
  affiliations,
  alumniOf,
  knowsAbout,
  addressLocality,
  addressCountry,
} from './portfolio/seo'
import { cardContentEn } from './portfolio/cards/en'
import { nodeLabels } from './portfolio/nodes/labels'
import { graphStructure } from './portfolio/nodes/structure'

const seoTitle = `${searchName} · ${jobTitle}`
const seoKeywordsStr = seoKeywords.join(', ')

// Respect VITE_BASE_URL so sitemap / manifest stay correct on subpath deployments
// (e.g. GitHub Pages: VITE_BASE_URL=/my-portfolio/).
// Normalise to always end with '/' so path concatenation is safe.
const rawBase = process.env.VITE_BASE_URL?.trim() || '/'
const viteBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`

// Normalise siteUrl — strip any trailing slash before appending so we never
// produce a double slash (e.g. "https://example.com/" + "/" → "…//").
const normalizedSiteUrl = siteUrl.replace(/\/+$/, '')
const canonicalUrl = viteBase === '/' ? `${normalizedSiteUrl}/` : `${normalizedSiteUrl}${viteBase}`

// ── Open Graph image tag ─────────────────────────────────────────────────────
const ogImageTag = ogImageUrl
  ? `<meta property="og:image" content="${ogImageUrl}" />\n    <meta name="twitter:image" content="${ogImageUrl}" />`
  : `<!-- og:image — add an ogImageUrl in portfolio/seo.ts to enable social previews -->`

// ── Twitter creator tag ──────────────────────────────────────────────────────
const twitterCreatorTag = twitterHandle
  ? `<meta name="twitter:creator" content="@${twitterHandle}" />`
  : `<!-- twitter:creator — add a twitterHandle in portfolio/seo.ts to enable this tag -->`

// ── hreflang alternate links (English only) ─────────────────────────────────
const hreflangTags = [
  `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`,
  `<link rel="alternate" hreflang="en"         href="${canonicalUrl}" />`,
].join('\n    ')

// ── JSON-LD Person schema ────────────────────────────────────────────────────
const sameAs = [githubUrl, linkedinUrl].filter(Boolean)

const jsonLd = JSON.stringify(
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: searchName,
    alternateName: fullName,
    jobTitle,
    description: seoDescription,
    url: normalizedSiteUrl,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    worksFor: { '@type': 'Organization', ...affiliation },
    affiliation: affiliations.map((organization) => ({ '@type': 'Organization', ...organization })),
    alumniOf: alumniOf.map((school) => ({ '@type': 'CollegeOrUniversity', ...school })),
    knowsAbout,
    address: { '@type': 'PostalAddress', addressLocality, addressCountry },
    sameAs,
  },
  null,
  2,
)

// ── Static text for crawlers without JavaScript ──────────────────────────────
// The same content the hidden SeoContent layer renders at runtime, written
// straight into index.html so a crawler that does not run scripts still reads
// who this is and what the site covers. Only what the graph shows is listed.
const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char)
const plainText = (markdown: string) => markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
const shownKeys = Object.values(graphStructure).flatMap((children) => children.map(({ key }) => key))

function staticSection(lang: 'en') {
  const cards = cardContentEn
  const labels = nodeLabels[lang]
  const items = shownKeys
    .filter((key) => cards[key])
    .map((key) => {
      const card = cards[key]
      const bullets = plainText(card.detailsText ?? '')
        .split('\n')
        .map((line) => line.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean)
      return `<li><h3>${escapeHtml(labels[key] ?? key)}</h3>${
        card.institutionText ? `<p>${escapeHtml(card.institutionText)}</p>` : ''
      }<p>${escapeHtml(plainText(card.summaryText ?? ''))}</p>${
        bullets.length ? `<ul>${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>` : ''
      }</li>`
    })
    .join('')
  return `<section lang="${lang}"><ul>${items}</ul></section>`
}

const staticContent = `<div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">
      <h1>${escapeHtml(searchName)}</h1>
      <p>${escapeHtml(jobTitle)}</p>
      <p>${escapeHtml(seoDescription)}</p>
      ${staticSection('en')}
      <p><a href="${githubUrl}">GitHub</a></p>
    </div>`

// ── 404 page ─────────────────────────────────────────────────────────────────
// A single-page site has one page: whatever path was asked for, send the
// visitor back to it.
const notFoundContent = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${viteBase}" />
    <title>${escapeHtml(seoTitle)}</title>
  </head>
  <body></body>
</html>
`

// ── Web App Manifest ─────────────────────────────────────────────────────────
const manifestContent = JSON.stringify(
  {
    name: seoTitle,
    short_name: fullName,
    description: seoDescription,
    start_url: viteBase,
    scope: viteBase,
    display: 'standalone',
    theme_color: themeColor,
    background_color: themeColor,
    icons: [
      {
        src: `${viteBase}favicon.svg`,
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any maskable',
      },
    ],
  },
  null,
  2,
)

// ── Sitemap ──────────────────────────────────────────────────────────────────
const lastmod = new Date().toISOString().split('T')[0]
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
  <url>
    <loc>${canonicalUrl}</loc>
    <xhtml:link rel="alternate" hreflang="x-default" href="${canonicalUrl}"/>
    <xhtml:link rel="alternate" hreflang="en"         href="${canonicalUrl}"/>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_URL?.trim() || '/',
  plugins: [
    react(),
    {
      // Inject portfolio SEO values into index.html at build / dev time.
      // All values come from portfolio/seo.ts — edit that file, not index.html.
      name: 'inject-portfolio-seo',
      transformIndexHtml(html) {
        return html
          .replace(/%SEO_TITLE%/g, () => seoTitle)
          .replace(/%SEO_DESCRIPTION%/g, () => seoDescription)
          .replace(/%SEO_KEYWORDS%/g, () => seoKeywordsStr)
          .replace(/%SEO_AUTHOR%/g, () => fullName)
          .replace(/%SEO_URL%/g, () => canonicalUrl)
          .replace(/%SEO_GITHUB_URL%/g, () => githubUrl)
          .replace(/%SEO_JOB_TITLE%/g, () => jobTitle)
          .replace(/%SEO_OG_IMAGE%/g, () => ogImageTag)
          .replace(/%SEO_TWITTER_CREATOR%/g, () => twitterCreatorTag)
          .replace(/%SEO_JSON_LD%/g, () => jsonLd)
          .replace(/%SEO_THEME_COLOR%/g, () => themeColor)
          .replace(/%SEO_HREFLANG%/g, () => hreflangTags)
          .replace(/%SEO_STATIC_CONTENT%/g, () => staticContent)
      },
    },
    {
      // Serve manifest.webmanifest in dev and write sitemap.xml + manifest in
      // production — all values come from portfolio/seo.ts.
      name: 'generate-manifest-and-sitemap',
      configureServer(server) {
        server.middlewares.use('/manifest.webmanifest', (_req, res) => {
          res.setHeader('Content-Type', 'application/manifest+json')
          res.end(manifestContent)
        })
      },
      writeBundle(options) {
        const outDir = options.dir ?? 'dist'
        fs.writeFileSync(path.join(outDir, 'manifest.webmanifest'), manifestContent, 'utf8')
        fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapContent, 'utf8')
        fs.writeFileSync(path.join(outDir, '404.html'), notFoundContent, 'utf8')
      },
    },
  ],
  build: {
        rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor'
          }

          if (id.includes('/tone/')) {
            return 'sound-vendor'
          }

          if (id.includes('/zustand/')) {
            return 'state-vendor'
          }

          return undefined
        },
      },
    },
  },
})
