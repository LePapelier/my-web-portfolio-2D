import type { GraphState, Node, Vec2 } from './types'

/**
 * A radial tree: the root at the centre, its children around it, each in its
 * own sector, and each child's children further out inside that sector. Since
 * sectors nest and the radius grows with depth, no two edges ever cross.
 *
 * A sector's width follows how much is open under it, so a branch being
 * unfolded takes room from its closed siblings; everything glides to its new
 * place.
 */

/** Radius added at each depth, in graph units. */
const RADIUS_STEPS = [0, 3.6, 2.7, 2.9]
const RADIUS_STEP_BEYOND = 3
/** The first child of the root sits straight up. */
const ROOT_START_ANGLE = -Math.PI / 2
/** Tempers the weights: a wide-open branch asks for more room, not all of it. */
const WEIGHT_EXPONENT = 0.7
/** How fast a node closes in on its place, per second. */
const GLIDE_RATE = 9
const MIN_DT = 0.001
const MAX_DT = 0.05
const SETTLED_DISTANCE = 0.0005

function radiusAtDepth(depth: number): number {
  let radius = 0
  for (let d = 1; d <= depth; d++) radius += RADIUS_STEPS[d] ?? RADIUS_STEP_BEYOND
  return radius
}

/** Where every node of the tree belongs, by id. */
export function computeTargets(nodes: Node[]): Map<string, Vec2> {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const targets = new Map<string, Vec2>()

  // Leaves shown under a node: one for a closed node, the sum for an open one.
  const leaves = new Map<string, number>()
  const countLeaves = (id: string): number => {
    const cached = leaves.get(id)
    if (cached !== undefined) return cached
    const node = byId.get(id)
    const childIds = node?.expanded ? (node.childrenIds ?? []) : []
    const count = childIds.length === 0 ? 1 : childIds.reduce((sum, childId) => sum + (byId.has(childId) ? countLeaves(childId) : 0), 0)
    leaves.set(id, Math.max(1, count))
    return Math.max(1, count)
  }
  const weight = (id: string) => countLeaves(id) ** WEIGHT_EXPONENT

  const place = (id: string, sectorStart: number, sectorWidth: number) => {
    const node = byId.get(id)
    if (!node) return
    const childIds = (node.childrenIds ?? []).filter((childId) => byId.has(childId))
    if (childIds.length === 0) return
    const total = childIds.reduce((sum, childId) => sum + weight(childId), 0)
    const radius = radiusAtDepth(node.depth + 1)
    let angle = sectorStart
    childIds.forEach((childId) => {
      const width = (weight(childId) / total) * sectorWidth
      const middle = angle + width / 2
      targets.set(childId, [Math.cos(middle) * radius, Math.sin(middle) * radius])
      place(childId, angle, width)
      angle += width
    })
  }

  targets.set('main', [0, 0])
  place('main', ROOT_START_ANGLE, Math.PI * 2)
  return targets
}

function isFrozenExpanding(node: Node, nowMs: number) {
  return !!node.expanding && !!node.expandStartAt && nowMs < node.expandStartAt
}

/** Moves every node a step closer to its place. */
export function tickLayoutReducer(state: GraphState, delta: number): GraphState | Partial<GraphState> {
  if (state.nodes.length <= 1) return state

  const dt = Math.min(Math.max(delta, MIN_DT), MAX_DT)
  const nowMs = Date.now()
  const nodes = state.nodes
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const targets = computeTargets(nodes)
  const glide = 1 - Math.exp(-GLIDE_RATE * dt)
  let changed = false

  const updated = nodes.map((node): Node => {
    let target: Vec2 | undefined

    if (isFrozenExpanding(node, nowMs)) {
      target = node.spawnFrom
    } else if (node.collapseRole === 'target') {
      // Folding away: back into the parent, once its turn has come.
      if (node.collapseStartAt && nowMs < node.collapseStartAt) return node
      target = (node.parentId ? byId.get(node.parentId)?.position : undefined) ?? node.position
    } else {
      target = targets.get(node.id)
    }
    if (!target) return node

    const dx = target[0] - node.position[0]
    const dy = target[1] - node.position[1]
    if (Math.abs(dx) < SETTLED_DISTANCE && Math.abs(dy) < SETTLED_DISTANCE) {
      if (node.position[0] === target[0] && node.position[1] === target[1]) return node
      changed = true
      return { ...node, position: [target[0], target[1]] }
    }
    changed = true
    return { ...node, position: [node.position[0] + dx * glide, node.position[1] + dy * glide] }
  })

  return changed ? { nodes: updated } : state
}
