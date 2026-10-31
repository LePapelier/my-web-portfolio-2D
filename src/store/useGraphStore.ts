import { create } from 'zustand'
import { initialNodes } from './graph/config'
import { expandNodeReducer } from './graph/expandNode'
import { tickLayoutReducer } from './graph/layout'
import type { GraphState, Node } from './graph/types'

export type { GraphState, Node }

export const useGraphStore = create<GraphState>((set) => ({
  // The 2D site is in English only; the data layer keeps both languages for
  // the 3D site's sake.
  language: 'en',
  hoveredNodeId: null,
  lastActivatedNodeId: null,
  nodes: initialNodes,
  expandNode: (id) => set((state) => ({ ...expandNodeReducer(state, id, set), lastActivatedNodeId: id })),
  setLastActivatedNodeId: (id) => set({ lastActivatedNodeId: id }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  tickLayout: (delta) => set((state) => tickLayoutReducer(state, delta)),
}))
