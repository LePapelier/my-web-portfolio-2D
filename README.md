# My web portfolio, in 2D

The black-and-white, flat version of my [3D portfolio](https://github.com/LePapelier/LePapelier.github.io):
the same tree of nodes to unfold, the same cards, drawn in plain HTML and
SVG rather than WebGL, without the sounds. Ink on paper by day, chalk on slate by
night: the theme follows the system. This version is in English only.

The tree is laid out radially: each branch owns a sector around the root and
its children sit further out inside it, so no two edges ever cross. A branch
being unfolded takes room from its closed siblings, and the view glides to
keep the whole tree on the screen. A closed card is just its title and a
"details" pill; it widens into a panel whose text is typed out as on a
keyboard. Nodes ride critically damped springs to their places.

The flight mode of the 3D site has no counterpart here, nor do its extra
cross-branch edges, which a planar drawing cannot have.

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
  labels, and each node's pictogram (the French labels are kept for the 3D
  site's sake, unused here);
- `cards/en.ts` — the cards of the leaves (`cards/fr.ts` likewise unused);
- `seo.ts` — titles, description, structured data.

Only the logos among the node pictograms are shown (the 3D site's line
icons are left out); they and the preview pictures keep their colours, and
links the blue of the 3D site.

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
