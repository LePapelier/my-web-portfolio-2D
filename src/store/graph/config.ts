import type { Language, Node, PortfolioChild } from './types'
import { mainNodeLabel, nodeLabels } from '../../../portfolio/nodes/labels'
import { graphStructure } from '../../../portfolio/nodes/structure'

export const defaultLanguage: Language = 'en'

function makeChild(key: string, language: Language, href?: string): PortfolioChild {
  return { key, label: getNodeLabel(key, language), href }
}

export function getNodeLabel(templateKey: string, language: Language): string {
  return nodeLabels[language][templateKey] ?? nodeLabels.en[templateKey] ?? templateKey
}

export function getMainNodeLabel(language: Language): string {
  return mainNodeLabel[language] ?? mainNodeLabel.en
}

export function getPortfolioStructure(language: Language): Record<string, PortfolioChild[]> {
  return Object.fromEntries(
    Object.entries(graphStructure).map(([parent, children]) => [
      parent,
      children.map((child) => makeChild(child.key, language, child.href)),
    ]),
  )
}

/** Milliseconds a node takes to fold back into its parent. */
export const collapseDurationMs = 300
/** Milliseconds between two siblings popping out. */
export const expandWaveStepMs = 140

export function hasChildren(templateKey: string): boolean {
  return (graphStructure[templateKey]?.length ?? 0) > 0
}

export function getNodeVisualType(templateKey: string): Node['visualType'] {
  return hasChildren(templateKey) ? 'disc' : 'text'
}


/**
 * How many levels hang under a template key: 0 for a leaf, 1 for a branch of
 * leaves, and so on. Bigger subtrees get bigger discs.
 */
export const subtreeHeightByTemplateKey: Map<string, number> = (() => {
  const heights = new Map<string, number>()
  const visiting = new Set<string>()
  const getHeight = (templateKey: string): number => {
    const cached = heights.get(templateKey)
    if (typeof cached === 'number') return cached
    if (visiting.has(templateKey)) return 0
    visiting.add(templateKey)
    const children = graphStructure[templateKey] ?? []
    const height = children.length > 0 ? 1 + Math.max(...children.map((child) => getHeight(child.key))) : 0
    visiting.delete(templateKey)
    heights.set(templateKey, height)
    return height
  }
  Object.keys(graphStructure).forEach(getHeight)
  getHeight('root')
  return heights
})()

const MIN_RADIUS = 0.1
const RADIUS_STEP_PER_LEVEL = 0.1
const MAX_RADIUS = 0.92

/** Disc radius of a node, in graph units. */
export function getNodeRadius(templateKey: string): number {
  const height = subtreeHeightByTemplateKey.get(templateKey) ?? 0
  return Math.min(MAX_RADIUS, MIN_RADIUS + height * RADIUS_STEP_PER_LEVEL)
}

export const initialNodes: Node[] = [
  {
    id: 'main',
    templateKey: 'root',
    visualType: getNodeVisualType('root'),
    expanding: false,
    position: [0, 0],
    spawnFrom: [0, 0],
    depth: 0,
    label: getMainNodeLabel(defaultLanguage),
    expanded: false,
    radius: getNodeRadius('root'),
  },
]
