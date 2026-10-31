/**
 * Graph structure — which nodes are children of which, and optional hrefs.
 *
 * Each key is a parent templateKey; its value is an array of child descriptors
 * `{ key, href? }`. Add an optional `href` to open an external URL when that
 * node is clicked.
 *
 * Rules:
 *  - Every key used here must have a matching entry in labels.ts.
 *  - Leaf nodes (no children) render as text nodes; some may be handled by
 *    specialized components or as pure external links.
 *  - Only leaf nodes with card content render as expandable card nodes.
 *  - Branch nodes (with children) render as spheres.
 */

import { githubUrl } from '../identity'

export interface StructureChild {
  key: string
  href?: string
}

export const graphStructure: Record<string, StructureChild[]> = {
  root: [
    { key: 'about' },
    { key: 'projects' },
    { key: 'experience' },
    { key: 'mail' },
    { key: 'github', href: githubUrl },
  ],
  about: [
    { key: 'about-story' },
    { key: 'about-location' },
  ],
  'about-story': [
    { key: 'phd' },
    { key: 'diploma-1' },
    { key: 'diploma-2' },
  ],
  projects: [
    { key: 'centurion-paper' },
    { key: 'centurion-scrabble' },
    { key: 'centurion-poker' },
    // Centurion Scheduler : masqué pour l'instant. Sa fiche et son libellé
    // restent prêts ; remettre cette ligne suffit à le faire réapparaître.
    // { key: 'centurion-scheduler' },
    // Portfolio web interactif : retiré. Sa fiche reste prête ; remettre
    // cette ligne suffit à le faire réapparaître.
    // { key: 'project-portfolio' },
  ],
  teaching: [
    { key: 'teaching-logic' },
    { key: 'teaching-algorithms' },
    { key: 'teaching-algorithmic-methods' },
    { key: 'teaching-programming' },
    { key: 'teaching-computability' },
  ],
  experience: [
    { key: 'teaching' },
    { key: 'exp-internship-2' },
    { key: 'exp-internship-1' },
  ],
}

/**
 * Extra edges that are drawn between nodes which are not in a parent-child
 * relationship. Each tuple is [sourceKey, targetKey].
 */
export const symmetricEdges: [string, string][] = [
  ['about-story', 'experience'],
  ['phd', 'experience'],
  ['teaching', 'phd'],
  ['projects', 'github'],
  ['exp-internship-1', 'diploma-2'],
  ['exp-internship-2', 'diploma-1'],
]
