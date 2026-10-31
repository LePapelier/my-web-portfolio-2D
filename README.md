# My web portfolio, in 2D

The black-and-white, flat version of my [3D portfolio](https://github.com/LePapelier/LePapelier.github.io):
the same graph of nodes to unfold, the same cards, both languages, the same
sounds, drawn in plain HTML and SVG rather than WebGL. Ink on paper by day,
chalk on slate by night: the theme follows the system, and a button in the
corner overrides it.

The flight mode of the 3D site has no counterpart here.

## Running it

```bash
npm install
npm run dev
```

`npm run build` type-checks and bundles the site into `dist/`. `npm run lint`
runs ESLint.

## Content

Everything the site shows comes from `portfolio/`, which is a copy of the 3D
site's data layer, so the two can be kept in sync by copying the folder:

- `identity.ts` — name and URLs;
- `nodes/structure.ts`, `nodes/labels.ts`, `nodes/icons.ts` — the graph, its
  labels in both languages, and each node's pictogram;
- `cards/fr.ts`, `cards/en.ts` — the cards of the leaves;
- `seo.ts` — titles, description, structured data.

Pictograms are Lucide icons copied into `public/icons/` by `npm run icons`;
they are drawn as masks in the ink colour. Logos and preview pictures are shown
in shades of grey.

## Email address

The contact node shows an email address drawn as an SVG, so it is never in the
page's text. The file is generated at build time from the `EMAIL` repository
secret and is never committed:

```bash
node scripts/generate-email-svg.mjs --email "you@example.com" --font public/fonts/Lato-Regular.ttf --out public/private-contact/email.svg
```

Without it, the node shows a placeholder.

## Deployment

A push to `main` builds the site and publishes it to GitHub Pages under the
repository's name (`/my-web-portfolio-2D/`), or at the root if `public/CNAME`
names a custom domain.
