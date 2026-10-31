import { create } from 'zustand'
import { defaultLanguage, getMainNodeLabel, getNodeLabel, initialNodes } from './graph/config'
import { expandNodeReducer } from './graph/expandNode'
import { tickLayoutReducer } from './graph/layout'
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
  tickLayout: (delta) => set((state) => tickLayoutReducer(state, delta)),
}))
