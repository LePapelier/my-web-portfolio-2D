import { create } from 'zustand'
import { defaultLanguage, getMainNodeLabel, getNodeLabel, initialNodes } from './graph/config'
import { expandNodeReducer } from './graph/expandNode'
import { tickPhysicsReducer } from './graph/physics'
import type { GraphState, Language, Node } from './graph/types'

export type { GraphState, Node }

const LANGUAGE_STORAGE_KEY = 'portfolio-language'

function isLanguage(value: string): value is Language {
  return value === 'en' || value === 'fr'
}

function getBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return defaultLanguage
  const candidates = [navigator.language, ...(navigator.languages ?? [])]
  return candidates.some((candidate) => candidate?.toLowerCase().startsWith('fr')) ? 'fr' : 'en'
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return defaultLanguage
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && isLanguage(stored)) return stored
  } catch {
    // Blocked storage: the browser's language will do.
  }
  return getBrowserLanguage()
}

export const useGraphStore = create<GraphState>((set) => ({
  language: getInitialLanguage(),
  draggedNodeId: null,
  hoveredNodeId: null,
  focusedCardNodeId: null,
  nodes: initialNodes,
  expandNode: (id) => set((state) => expandNodeReducer(state, id, set)),
  setLanguage: (language) =>
    set((state) => {
      if (state.language === language) return state
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
      } catch {
        // The choice just won't stick between visits.
      }
      return {
        language,
        nodes: state.nodes.map((node) => ({
          ...node,
          label: node.id === 'main' ? getMainNodeLabel(language) : getNodeLabel(node.templateKey, language),
        })),
      }
    }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  setFocusedCardNodeId: (id) => set({ focusedCardNodeId: id }),
  startDragging: (id) =>
    set((state) => {
      const node = state.nodes.find((candidate) => candidate.id === id)
      if (!node || node.id === 'main') return state
      return { draggedNodeId: id }
    }),
  stopDragging: () => set({ draggedNodeId: null }),
  moveNode: (id, position) =>
    set((state) => {
      const index = state.nodes.findIndex((node) => node.id === id)
      if (index === -1 || id === 'main') return state
      const current = state.nodes[index]
      if (current.position[0] === position[0] && current.position[1] === position[1]) return state
      const nodes = [...state.nodes]
      nodes[index] = { ...current, position, velocity: [0, 0] }
      return { nodes }
    }),
  tickPhysics: (delta) => set((state) => tickPhysicsReducer(state, delta)),
}))
