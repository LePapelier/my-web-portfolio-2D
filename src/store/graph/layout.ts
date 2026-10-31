import type { GraphState, Node, Vec2 } from './types'

/**
 * A radial tree: the root at the centre, its children around it, each in its
 * own sector, and each child's children further out inside that sector. Since
 * sectors nest and the radius grows along every path from the root, no two
 * edges ever cross.
 *
 * The layout knows how big each node is drawn (see `setNodeBox`): a sector is
 * as wide as what it holds, and a ring of children sits far enough out for
 * them all to fit side by side. An open card therefore pushes its neighbours
 * aside and the next ring outwards, and everything glides to its new place.
 */

/** The least a ring of children sits beyond its parent, by depth, in graph units. */
const RADIUS_STEPS = [0, 3.6, 2.7, 2.9]
const RADIUS_STEP_BEYOND = 3
/** The first child of the root sits straight up. */
const ROOT_START_ANGLE = -Math.PI / 2
/** Room kept between two nodes' drawings, in graph units. */
const MARGIN = 0.45
/** A node whose drawing has not been measured yet is taken to be this big. */
const DEFAULT_REACH = 0.5
/**
 * The motion: every node is a mass on a spring anchored to its place, with
 * just enough damping to settle without a bounce. Speed builds up and dies
 * down smoothly, and a place that moves mid-flight is simply followed.
 */
/** The spring's natural frequency, in radians per second: about a second to settle. */
const SPRING_OMEGA = 6
/** Damping ratio: 1 is critical, the fastest settle without overshoot. */
const SPRING_DAMPING = 1
/** The simulation never steps further than this, for stability. */
const MAX_STEP = 1 / 60
const MAX_FRAME = 0.1
const SETTLED_DISTANCE = 0.0005
const SETTLED_SPEED = 0.002

// ── What each node takes on the page ────────────────────────────────────────

/** A node's drawing, in graph units around its point. */
export interface NodeBox {
  left: number
  top: number
  right: number
  bottom: number
}

const boxes = new Map<string, NodeBox>()
let boxesVersion = 0
const boxListeners = new Set<() => void>()

function sameBox(a: NodeBox | undefined, b: NodeBox | null) {
  if (!a || !b) return !a && !b
  const tolerance = 0.02
  return (
    Math.abs(a.left - b.left) < tolerance &&
    Math.abs(a.top - b.top) < tolerance &&
    Math.abs(a.right - b.right) < tolerance &&
    Math.abs(a.bottom - b.bottom) < tolerance
  )
}

/** Records how big a node is drawn, or forgets it; the layout follows. */
export function setNodeBox(id: string, box: NodeBox | null) {
  if (sameBox(boxes.get(id), box)) return
  if (box) boxes.set(id, box)
  else boxes.delete(id)
  boxesVersion += 1
  boxListeners.forEach((listener) => listener())
}

export function subscribeBoxes(listener: () => void): () => void {
  boxListeners.add(listener)
  return () => boxListeners.delete(listener)
}

export function getBoxesVersion() {
  return boxesVersion
}

export function getNodeBox(id: string): NodeBox | undefined {
  return boxes.get(id)
}

/** A node's drawing as a loose circle, for the rough estimates. */
function roughReach(id: string): number {
  const box = boxes.get(id)
  if (!box) return DEFAULT_REACH
  return (box.right - box.left + box.bottom - box.top) / 4
}

/**
 * How far a node's drawing reaches on either side of its ray, and along it,
 * when it sits at a given angle. Sideways is measured across the ray: `before`
 * towards smaller angles, `after` towards larger ones; `inward` is how far it
 * comes back towards the root, `outward` how far it goes on.
 */
function extents(id: string, angle: number) {
  const box = boxes.get(id) ?? { left: -DEFAULT_REACH, top: -DEFAULT_REACH, right: DEFAULT_REACH, bottom: DEFAULT_REACH }
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let before = 0
  let after = 0
  let inward = 0
  let outward = 0
  for (const [x, y] of [
    [box.left, box.top],
    [box.right, box.top],
    [box.left, box.bottom],
    [box.right, box.bottom],
  ]) {
    const across = -x * dy + y * dx
    const along = x * dx + y * dy
    before = Math.max(before, -across)
    after = Math.max(after, across)
    inward = Math.max(inward, -along)
    outward = Math.max(outward, along)
  }
  return { before, after, inward, outward }
}

// ── Placing the tree ─────────────────────────────────────────────────────────

function stepAtDepth(depth: number): number {
  return RADIUS_STEPS[depth] ?? RADIUS_STEP_BEYOND
}

/** Passes of refinement: where a node sits decides how wide it is, and back. */
const PLACEMENT_PASSES = 3

/** Where every node of the tree belongs, by id. */
export function computeTargets(nodes: Node[]): Map<string, Vec2> {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const targets = new Map<string, Vec2>()

  const childrenOf = (id: string) => {
    const node = byId.get(id)
    return (node?.childrenIds ?? []).filter((childId) => byId.has(childId))
  }

  // The angle a subtree asks for, estimated roughly with the rings at their
  // least radii: enough for its widest ring of drawings, at any depth.
  const needs = new Map<string, number>()
  const subtreeNeed = (id: string, radius: number): number => {
    const cached = needs.get(id)
    if (cached !== undefined) return cached
    const node = byId.get(id)
    const children = childrenOf(id)
    let need = 0
    if (node && children.length > 0) {
      const ringRadius = radius + stepAtDepth(node.depth + 1)
      need = children.reduce(
        (sum, childId) => sum + Math.max((2 * roughReach(childId) + MARGIN) / ringRadius, subtreeNeed(childId, ringRadius)),
        0,
      )
    }
    needs.set(id, need)
    return need
  }

  const place = (id: string, radius: number, angle: number, sectorStart: number, sectorWidth: number) => {
    const node = byId.get(id)
    if (!node) return
    const children = childrenOf(id)
    if (children.length === 0) return

    // First guess: everyone at the middle of an equal share.
    let angles = children.map((_, index) => sectorStart + ((index + 0.5) / children.length) * sectorWidth)
    let starts = angles.map(() => sectorStart)
    let widths = angles.map(() => sectorWidth / children.length)
    let ringRadius = radius

    for (let pass = 0; pass < PLACEMENT_PASSES; pass++) {
      const sides = children.map((childId, index) => extents(childId, angles[index]))
      const own = extents(id, angle)

      // The ring: at least a step out, clear of the parent's drawing and the
      // children's, and wide enough for the children to sit side by side.
      const chords = sides.map((side) => side.before + side.after + MARGIN)
      ringRadius = Math.max(
        radius + stepAtDepth(node.depth + 1),
        radius + own.outward + Math.max(...sides.map((side) => side.inward)) + MARGIN,
        chords.reduce((sum, value) => sum + value, 0) / sectorWidth,
      )

      // Each child's share of the sector: its own width on the ring, or what
      // its subtree asks for, whichever is more.
      const shares = children.map((childId, index) => Math.max(chords[index] / ringRadius, subtreeNeed(childId, ringRadius)))
      const total = shares.reduce((sum, value) => sum + value, 0)
      let cursor = sectorStart
      starts = []
      widths = []
      angles = children.map((_, index) => {
        const width = (shares[index] / total) * sectorWidth
        // The drawing hangs off the point unevenly: shift the point so the
        // drawing, not the point, sits in the middle of the share.
        const shift = ((sides[index].before - sides[index].after) / 2) / ringRadius
        const middle = cursor + width / 2
        const placed = Math.min(cursor + width, Math.max(cursor, middle + shift))
        starts.push(cursor)
        widths.push(width)
        cursor += width
        return placed
      })
    }

    children.forEach((childId, index) => {
      targets.set(childId, [Math.cos(angles[index]) * ringRadius, Math.sin(angles[index]) * ringRadius])
      place(childId, ringRadius, angles[index], starts[index], widths[index])
    })
  }

  targets.set('main', [0, 0])
  place('main', 0, 0, ROOT_START_ANGLE, Math.PI * 2)
  return targets
}

function isFrozenExpanding(node: Node, nowMs: number) {
  return !!node.expanding && !!node.expandStartAt && nowMs < node.expandStartAt
}

/** Advances the springs by a frame: every node moves a step towards its place. */
export function tickLayoutReducer(state: GraphState, delta: number): GraphState | Partial<GraphState> {
  if (state.nodes.length <= 1) return state

  const nowMs = Date.now()
  const nodes = state.nodes
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const targets = computeTargets(nodes)
  let changed = false

  const updated = nodes.map((node): Node => {
    let target: Vec2 | undefined

    if (isFrozenExpanding(node, nowMs)) {
      // Waiting its turn on its parent: no motion yet.
      if (node.position[0] === node.spawnFrom[0] && node.position[1] === node.spawnFrom[1] && !node.velocity) return node
      changed = true
      return { ...node, position: [...node.spawnFrom], velocity: undefined }
    } else if (node.collapseRole === 'target') {
      // Folding away: back into the parent, once its turn has come.
      if (node.collapseStartAt && nowMs < node.collapseStartAt) return node
      target = (node.parentId ? byId.get(node.parentId)?.position : undefined) ?? node.position
    } else {
      target = targets.get(node.id)
    }
    if (!target) return node

    let [x, y] = node.position
    let [vx, vy] = node.velocity ?? [0, 0]
    let remaining = Math.min(delta, MAX_FRAME)
    while (remaining > 0) {
      const dt = Math.min(remaining, MAX_STEP)
      remaining -= dt
      const ax = SPRING_OMEGA * SPRING_OMEGA * (target[0] - x) - 2 * SPRING_DAMPING * SPRING_OMEGA * vx
      const ay = SPRING_OMEGA * SPRING_OMEGA * (target[1] - y) - 2 * SPRING_DAMPING * SPRING_OMEGA * vy
      vx += ax * dt
      vy += ay * dt
      x += vx * dt
      y += vy * dt
    }

    const settled =
      Math.abs(target[0] - x) < SETTLED_DISTANCE &&
      Math.abs(target[1] - y) < SETTLED_DISTANCE &&
      Math.abs(vx) < SETTLED_SPEED &&
      Math.abs(vy) < SETTLED_SPEED
    if (settled) {
      if (node.position[0] === target[0] && node.position[1] === target[1] && !node.velocity) return node
      changed = true
      return { ...node, position: [target[0], target[1]], velocity: undefined }
    }
    changed = true
    return { ...node, position: [x, y], velocity: [vx, vy] }
  })

  return changed ? { nodes: updated } : state
}
