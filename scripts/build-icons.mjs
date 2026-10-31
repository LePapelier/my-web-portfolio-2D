/**
 * Icônes des titres du graphe : des pictogrammes Lucide (licence ISC),
 * recopiés en SVG monochromes dans public/icons/.
 *
 * Ils sont tracés en `currentColor` et affichés comme masques CSS, de sorte
 * qu'ils prennent la couleur du texte : noir sur le thème clair, blanc sur le
 * thème sombre.
 *
 *   npm run icons
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import { labelIconNames } from '../portfolio/nodes/icons.ts'

const require = createRequire(import.meta.url)
const lucideDir = join(dirname(require.resolve('lucide-static/package.json')), 'icons')
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const SIZE = 128

for (const name of new Set(labelIconNames)) {
  const source = readFileSync(join(lucideDir, `${name}.svg`), 'utf8')
  const svg = source
    .replace(/<!--[\s\S]*?-->\s*/g, '')
    .replace(/\s*class="[^"]*"/, '')
    .replace(/width="24"/, `width="${SIZE}"`)
    .replace(/height="24"/, `height="${SIZE}"`)
    .replace(/\n\s*/g, ' ')
    .replace(/\s+>/g, '>')
    .trim()
  writeFileSync(join(outDir, `${name}.svg`), `${svg}\n`)
  console.log(`public/icons/${name}.svg`)
}
