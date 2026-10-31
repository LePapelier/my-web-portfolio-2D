import type { GraphState, Node, Vec2 } from './types'
import { symmetricEdges } from './config'

/**
 * The force-directed layout: every node repels every other nearby node, and
 * every edge is a spring with a rest length. Heavier discs move less. A node
 * popping out waits on its parent until its turn; a node folding away slides
 * back into its parent.
 */

const MIN_DT = 0.001
const MAX_DT = 0.033
const REPULSION = 80
const SPRING_STRENGTH = 20
const REST_LENGTH = 3.6
const DAMPING = 0.9
const REPULSION_MAX_DISTANCE = 8
const REPULSION_MAX_DISTANCE_SQ = REPULSION_MAX_DISTANCE * REPULSION_MAX_DISTANCE
const VECTOR_EPSILON = 0.0001
const MIN_DISTANCE_SQ = 0.08
const MIN_SPRING_DISTANCE = 0.001
const BASE_NODE_MASS = 1
const NODE_MASS_SCALE = 3
const SPRING_MASS_ATTENUATION_EXPONENT = 1.25

function isFrozenExpanding(node: Node, nowMs: number) {
  return !!node.expanding && !!node.expandStartAt && nowMs < node.expandStartAt
}

function isSameVector(a: Vec2, b: Vec2) {
  return Math.abs(a[0] - b[0]) < VECTOR_EPSILON && Math.abs(a[1] - b[1]) < VECTOR_EPSILON
}

/**
 * How much room a node asks for around it. A disc pushes with its radius; a
 * leaf, drawn as a line of text or a card wider than any disc, pushes with
 * the room its drawing takes, even though it stays light to move.
 */
const TEXT_FOOTPRINT = 0.5
const CARD_FOOTPRINT = 0.9
const MIN_DISC_FOOTPRINT = 0.35

function getFootprint(node: Node) {
  if (node.visualType === 'disc') return Math.max(node.radius ?? 0, MIN_DISC_FOOTPRINT)
  return node.isCard ? CARD_FOOTPRINT : TEXT_FOOTPRINT
}

function getNodeMass(node: Node) {
  const radius = node.radius ?? 0.5
  return BASE_NODE_MASS + radius * radius * radius * NODE_MASS_SCALE
}

export function tickPhysicsReducer(state: GraphState, delta: number): GraphState | Partial<GraphState> {
  if (state.nodes.length <= 1) return state

  const dt = Math.min(Math.max(delta, MIN_DT), MAX_DT)
  const nowMs = Date.now()
  const draggedNodeId = state.draggedNodeId

  const nodes = state.nodes
  const idIndex = new Map(nodes.map((node, index) => [node.id, index]))
  const templateKeyIndex = new Map<string, number>()
  nodes.forEach((node, index) => {
    if (!templateKeyIndex.has(node.templateKey)) templateKeyIndex.set(node.templateKey, index)
  })

  const forces: Vec2[] = nodes.map(() => [0, 0])
  const masses = nodes.map(getNodeMass)
  const footprints = nodes.map(getFootprint)
  const invMass = masses.map((mass) => 1 / mass)
  const invMassSpring = masses.map((mass) => 1 / Math.pow(mass, SPRING_MASS_ATTENUATION_EXPONENT))

  // Repulsion, between every active pair within reach. The graph never holds
  // more than a few dozen nodes, so the pairs are simply all tried.
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]
    if (isFrozenExpanding(a, nowMs)) continue
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j]
      if (isFrozenExpanding(b, nowMs)) continue

      const dx = b.position[0] - a.position[0]
      const dy = b.position[1] - a.position[1]
      const distSq = Math.max(dx * dx + dy * dy, MIN_DISTANCE_SQ)
      if (distSq > REPULSION_MAX_DISTANCE_SQ) continue

      const dist = Math.sqrt(distSq)
      const falloff = 1 - distSq / REPULSION_MAX_DISTANCE_SQ
      const strengthOnA = ((REPULSION * footprints[j]) / distSq) * falloff * falloff
      const strengthOnB = ((REPULSION * footprints[i]) / distSq) * falloff * falloff

      forces[i][0] -= (dx / dist) * strengthOnA * invMass[i]
      forces[i][1] -= (dy / dist) * strengthOnA * invMass[i]
      forces[j][0] += (dx / dist) * strengthOnB * invMass[j]
      forces[j][1] += (dy / dist) * strengthOnB * invMass[j]
    }
  }

  const spring = (fromIndex: number, toIndex: number) => {
    const from = nodes[fromIndex]
    const to = nodes[toIndex]
    if (isFrozenExpanding(from, nowMs) || isFrozenExpanding(to, nowMs)) return

    const dx = to.position[0] - from.position[0]
    const dy = to.position[1] - from.position[1]
    const distance = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_SPRING_DISTANCE)
    const springForce = (distance - REST_LENGTH) * SPRING_STRENGTH
    const fx = (dx / distance) * springForce
    const fy = (dy / distance) * springForce

    forces[fromIndex][0] += fx * invMassSpring[fromIndex]
    forces[fromIndex][1] += fy * invMassSpring[fromIndex]
    forces[toIndex][0] -= fx * invMassSpring[toIndex]
    forces[toIndex][1] -= fy * invMassSpring[toIndex]
  }

  nodes.forEach((node, index) => {
    node.childrenIds?.forEach((childId) => {
      const childIndex = idIndex.get(childId)
      if (childIndex != null) spring(index, childIndex)
    })
  })

  symmetricEdges.forEach(([fromKey, toKey]) => {
    const fromIndex = templateKeyIndex.get(fromKey)
    const toIndex = templateKeyIndex.get(toKey)
    if (fromIndex == null || toIndex == null || fromIndex === toIndex) return
    spring(fromIndex, toIndex)
  })

  let hasStateChanged = false

  const updated = nodes.map((node, index): Node => {
    let nextPosition: Vec2
    let nextVelocity: Vec2

    if (isFrozenExpanding(node, nowMs)) {
      nextPosition = [...node.spawnFrom]
      nextVelocity = [0, 0]
    } else if (node.collapseRole === 'target') {
      if (node.collapseStartAt && nowMs < node.collapseStartAt) {
        nextPosition = node.position
        nextVelocity = [0, 0]
      } else {
        const parentIndex = node.parentId ? idIndex.get(node.parentId) : undefined
        const target = parentIndex != null ? nodes[parentIndex].position : node.position
        const retractSpeed = Math.min(1, dt * 10)
        nextPosition = [
          node.position[0] + (target[0] - node.position[0]) * retractSpeed,
          node.position[1] + (target[1] - node.position[1]) * retractSpeed,
        ]
        nextVelocity = [0, 0]
      }
    } else if (node.id === draggedNodeId || node.id === 'main') {
      // The dragged node goes where the pointer puts it; the root stays put.
      nextPosition = node.id === 'main' ? [0, 0] : node.position
      nextVelocity = [0, 0]
    } else {
      nextVelocity = [
        (node.velocity[0] + forces[index][0] * dt) * DAMPING,
        (node.velocity[1] + forces[index][1] * dt) * DAMPING,
      ]
      nextPosition = [node.position[0] + nextVelocity[0] * dt, node.position[1] + nextVelocity[1] * dt]
    }

    if (isSameVector(nextPosition, node.position) && isSameVector(nextVelocity, node.velocity)) {
      return node
    }
    hasStateChanged = true
    return { ...node, position: nextPosition, velocity: nextVelocity }
  })

  return hasStateChanged ? { nodes: updated } : state
}
