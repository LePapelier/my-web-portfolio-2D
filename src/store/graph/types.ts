/** A point or a velocity in the plane, in graph units. */
export type Vec2 = [number, number]

export interface Node {
  id: string
  templateKey: string
  /** A branch (with children) is drawn as a disc; a leaf, as text or a card. */
  visualType: 'disc' | 'text'
  /** A leaf with a card to open: wider than the others, so it asks for more room. */
  isCard?: boolean
  href?: string
  /** Popping out of its parent: held at spawnFrom until expandStartAt. */
  expanding?: boolean
  expandStartAt?: number
  /** Folding back: the source is the node being closed, the targets its subtree. */
  collapsing?: boolean
  collapseRole?: 'source' | 'target'
  collapseReverseRequested?: boolean
  collapseStartAt?: number
  position: Vec2
  velocity: Vec2
  label: string
  depth: number
  spawnFrom: Vec2
  parentId?: string
  childrenIds?: string[]
  expanded?: boolean
  /** Disc radius, in graph units; drives the mass in the simulation. */
  radius?: number
}

export type Language = 'en' | 'fr'

export interface GraphState {
  nodes: Node[]
  language: Language
  draggedNodeId: string | null
  hoveredNodeId: string | null
  focusedCardNodeId: string | null
  expandNode: (id: string) => void
  setLanguage: (language: Language) => void
  setHoveredNode: (id: string | null) => void
  setFocusedCardNodeId: (id: string | null) => void
  startDragging: (id: string) => void
  stopDragging: () => void
  moveNode: (id: string, position: Vec2) => void
  tickPhysics: (delta: number) => void
}

export interface PortfolioChild {
  key: string
  label: string
  href?: string
}
