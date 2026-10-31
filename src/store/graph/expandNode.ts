import {
  collapseDurationMs,
  expandWaveStepMs,
  getNodeLabel,
  getNodeRadius,
  getPortfolioStructure,
  getNodeVisualType,
  isCardTemplate,
} from './config'
import type { GraphState, Node, Vec2 } from './types'

type GraphSet = (updater: (state: GraphState) => GraphState | Partial<GraphState>) => void

const SPAWN_JITTER = 0.24
const EXPAND_STATE_DURATION_MS = 520

function shuffleWaveSlots(size: number) {
  const slots = Array.from({ length: size }, (_, slot) => slot)
  for (let index = slots.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[slots[index], slots[randomIndex]] = [slots[randomIndex], slots[index]]
  }
  return slots
}

function createSpawnOrigin(position: Vec2): Vec2 {
  return [
    position[0] + (Math.random() - 0.5) * SPAWN_JITTER,
    position[1] + (Math.random() - 0.5) * SPAWN_JITTER,
  ]
}

function collectSubtreeIds(nodesById: Map<string, Node>, rootNodeId: string) {
  const ids = new Set<string>()
  const visit = (nodeId: string) => {
    nodesById.get(nodeId)?.childrenIds?.forEach((childId) => {
      if (ids.has(childId)) return
      ids.add(childId)
      visit(childId)
    })
  }
  visit(rootNodeId)
  return ids
}

function isRootCollapsing(nodes: Node[], rootId: string) {
  return !!nodes.find((node) => node.id === rootId)?.collapsing
}

/**
 * Opens a closed branch, closes an open one, or reopens one that is still
 * folding away. Closing is a cascade: the deepest branches fold first, each
 * node retracting into its parent, and the subtree is removed once it is in.
 */
export function expandNodeReducer(
  state: GraphState,
  id: string,
  set: GraphSet,
): GraphState | Partial<GraphState> {
  const parent = state.nodes.find((node) => node.id === id)
  if (!parent) return state

  // Clicked again while closing: turn around.
  if (parent.collapsing && parent.collapseRole === 'source') {
    const nodesById = new Map(state.nodes.map((node) => [node.id, node]))
    const parentChildIds = parent.childrenIds ?? []
    const directChildIds = new Set(parentChildIds)
    const developedDirectChildIds = parentChildIds.filter((childId) => !!nodesById.get(childId)?.childrenIds?.length)

    developedDirectChildIds.forEach((childId) => {
      setTimeout(() => {
        set((current) => {
          const child = current.nodes.find((node) => node.id === childId)
          if (!child || !child.expanded || child.collapsing) return { nodes: current.nodes }
          return expandNodeReducer(current, childId, set)
        })
      }, 0)
    })

    return {
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, collapseReverseRequested: true }
          : directChildIds.has(node.id)
            ? {
                ...node,
                collapsing: false,
                collapseRole: undefined,
                collapseReverseRequested: undefined,
                collapseStartAt: undefined,
              }
            : node,
      ),
    }
  }

  if (parent.expanded) {
    const byId = new Map(state.nodes.map((node) => [node.id, node]))
    const collapseStartedAt = Date.now()

    const scheduleNodeCollapse = (nodeId: string, startAtMs: number): number => {
      const childIds = byId.get(nodeId)?.childrenIds ?? []
      if (childIds.length === 0) return 0

      let maxChildrenDuration = 0

      childIds.forEach((childId) => {
        const childNode = byId.get(childId)
        if (!childNode) return

        const isDevelopedBranch = !!(childNode.expanded && childNode.childrenIds?.length)
        const nestedDuration = isDevelopedBranch ? scheduleNodeCollapse(childId, startAtMs) : 0
        const childCollapseStartAt = startAtMs + nestedDuration
        const childDeleteAt = childCollapseStartAt + collapseDurationMs

        setTimeout(() => {
          set((current) => {
            if (!isRootCollapsing(current.nodes, id)) return { nodes: current.nodes }
            if (current.nodes.find((node) => node.id === id)?.collapseReverseRequested) {
              return { nodes: current.nodes }
            }
            return {
              nodes: current.nodes.map((node) =>
                node.id === childId
                  ? {
                      ...node,
                      expanded: false,
                      collapsing: true,
                      collapseRole: 'target',
                      collapseStartAt: childCollapseStartAt,
                    }
                  : node,
              ),
            }
          })
        }, Math.max(0, childCollapseStartAt - collapseStartedAt))

        setTimeout(() => {
          set((current) => {
            if (!isRootCollapsing(current.nodes, id)) return { nodes: current.nodes }
            if (current.nodes.find((node) => node.id === id)?.collapseReverseRequested) {
              return { nodes: current.nodes }
            }
            const currentById = new Map(current.nodes.map((node) => [node.id, node]))
            const subtreeIds = collectSubtreeIds(currentById, childId)
            subtreeIds.add(childId)
            return {
              nodes: current.nodes
                .filter((node) => !subtreeIds.has(node.id))
                .map((node) =>
                  node.id === nodeId
                    ? { ...node, childrenIds: node.childrenIds?.filter((candidate) => candidate !== childId) }
                    : node,
                ),
            }
          })
        }, Math.max(0, childDeleteAt - collapseStartedAt))

        maxChildrenDuration = Math.max(maxChildrenDuration, nestedDuration + collapseDurationMs)
      })

      return maxChildrenDuration
    }

    const rootChildrenDuration = scheduleNodeCollapse(id, collapseStartedAt)

    setTimeout(() => {
      set((current) => {
        if (!isRootCollapsing(current.nodes, id)) return { nodes: current.nodes }
        const rootNow = current.nodes.find((node) => node.id === id)
        if (rootNow?.collapseReverseRequested) {
          return {
            nodes: current.nodes.map((node) =>
              node.id === id
                ? {
                    ...node,
                    collapsing: false,
                    collapseRole: undefined,
                    collapseReverseRequested: undefined,
                    collapseStartAt: undefined,
                  }
                : node,
            ),
          }
        }
        return {
          nodes: current.nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  expanded: false,
                  childrenIds: undefined,
                  collapsing: false,
                  collapseRole: undefined,
                  collapseReverseRequested: undefined,
                  collapseStartAt: undefined,
                }
              : node,
          ),
        }
      })
    }, rootChildrenDuration)

    return {
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, collapsing: true, collapseRole: 'source', collapseReverseRequested: undefined, collapseStartAt: undefined }
          : node,
      ),
    }
  }

  const childDefinitions = getPortfolioStructure(state.language)[parent.templateKey] ?? []
  if (childDefinitions.length === 0) return state

  const expandStartedAt = Date.now()
  const waveSlots = shuffleWaveSlots(childDefinitions.length)

  // Children start on their parent and are pushed out by the simulation once
  // their turn in the wave comes.
  const children: Node[] = childDefinitions.map((childDef, index) => {
    const spawnOrigin = createSpawnOrigin(parent.position)
    return {
      id: `${id}-${childDef.key}`,
      templateKey: childDef.key,
      visualType: getNodeVisualType(childDef.key),
      isCard: isCardTemplate(childDef.key),
      href: childDef.href,
      expanding: true,
      expandStartAt: expandStartedAt + waveSlots[index] * expandWaveStepMs,
      collapsing: false,
      label: getNodeLabel(childDef.key, state.language),
      position: spawnOrigin,
      velocity: [0, 0],
      spawnFrom: spawnOrigin,
      parentId: parent.id,
      depth: parent.depth + 1,
      expanded: false,
      radius: getNodeRadius(childDef.key),
    }
  })

  children.forEach((child) => {
    const clearAt = (child.expandStartAt ?? expandStartedAt) + EXPAND_STATE_DURATION_MS
    setTimeout(() => {
      set((current) => ({
        nodes: current.nodes.map((node) =>
          node.id === child.id && node.expanding
            ? { ...node, expanding: false, expandStartAt: undefined }
            : node,
        ),
      }))
    }, Math.max(0, clearAt - expandStartedAt))
  })

  return {
    nodes: [
      ...state.nodes.map((node) =>
        node.id === id
          ? { ...node, expanded: true, childrenIds: children.map((child) => child.id), collapseReverseRequested: undefined }
          : node,
      ),
      ...children,
    ],
  }
}
