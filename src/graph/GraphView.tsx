import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useGraphStore } from '../store/useGraphStore'
import type { Node } from '../store/graph/types'
import { symmetricEdges } from '../store/graph/config'
import { playSound } from '../lib/sound'
import { reducedMotion } from '../lib/motion'
import {
  UNIT,
  ZOOM_MAX,
  attachWorld,
  getView,
  getViewportSize,
  glideTo,
  isGliding,
  panBy,
  retargetGlide,
  screenToWorld,
  setView,
  setViewportSize,
  subscribeView,
  tickView,
  zoomAt,
} from './viewport'
import type { View } from './viewport'
import { copy } from './content'
import GraphNode from './GraphNode'

/** Seconds between two steps of the simulation. */
const PHYSICS_STEP = 1 / 40
/** Milliseconds of stillness before the root starts to beckon, then to say so. */
const START_HINT_WOBBLE_DELAY_MS = 5000
const START_HINT_TEXT_DELAY_MS = 10000
/** Share of the viewport a focused card fills. */
const FOCUS_FILL = 0.9
/** Wheel: one notch of 100 zooms by about 16%. */
const WHEEL_ZOOM_RATE = 0.0015

interface Edge {
  key: string
  from: Node
  to: Node
  symmetric: boolean
}

/** Trims an edge so it stops at the rim of a disc rather than at its centre. */
function edgeEnds(edge: Edge): [number, number, number, number] | null {
  const [x1, y1] = edge.from.position
  const [x2, y2] = edge.to.position
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy)
  const fromInset = edge.from.visualType === 'disc' ? (edge.from.radius ?? 0) : 0
  const toInset = edge.to.visualType === 'disc' ? (edge.to.radius ?? 0) : 0
  if (length <= fromInset + toInset + 0.01) return null
  const ux = dx / length
  const uy = dy / length
  return [x1 + ux * fromInset, y1 + uy * fromInset, x2 - ux * toInset, y2 - uy * toInset]
}

/**
 * The invitation under the root, in screen space so it reads the same at any
 * zoom; it follows the root as the view moves.
 */
function StartHint({ text, rootRadius }: { text: string; rootRadius: number }) {
  const [view, setViewState] = useState<View>(() => ({ ...getView() }))
  useEffect(() => subscribeView((next) => setViewState({ ...next })), [])
  const { width, height } = getViewportSize()
  const scale = view.k * UNIT
  const left = width / 2 - view.x * scale
  const top = height / 2 - view.y * scale + rootRadius * scale + 24
  return (
    <p className="start-hint" style={{ left, top }}>
      {text}
    </p>
  )
}

export default function GraphView() {
  const nodes = useGraphStore((state) => state.nodes)
  const language = useGraphStore((state) => state.language)
  const hoveredNodeId = useGraphStore((state) => state.hoveredNodeId)
  const focusedCardNodeId = useGraphStore((state) => state.focusedCardNodeId)
  const setFocusedCardNodeId = useGraphStore((state) => state.setFocusedCardNodeId)
  const tickPhysics = useGraphStore((state) => state.tickPhysics)

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const worldRef = useRef<HTMLDivElement | null>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ distance: number; x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [showStartHint, setShowStartHint] = useState(false)
  const [showStartHintText, setShowStartHintText] = useState(false)

  // The view saved when a card was focused, and how the view sits relative to
  // that card, so it follows the card if the simulation moves it.
  const savedViewRef = useRef<View | null>(null)
  const followOffsetRef = useRef<{ dx: number; dy: number } | null>(null)
  const focusedCardNodeIdRef = useRef(focusedCardNodeId)
  useEffect(() => {
    focusedCardNodeIdRef.current = focusedCardNodeId
  }, [focusedCardNodeId])

  const rootNode = useMemo(() => nodes.find((node) => node.id === 'main') ?? null, [nodes])
  const isRootExpanded = !!rootNode?.expanded
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const firstNodeByTemplateKey = useMemo(() => {
    const byKey = new Map<string, Node>()
    nodes.forEach((node) => {
      if (!byKey.has(node.templateKey)) byKey.set(node.templateKey, node)
    })
    return byKey
  }, [nodes])

  const edges = useMemo(() => {
    const list: Edge[] = []
    nodes.forEach((node) => {
      node.childrenIds?.forEach((childId) => {
        const child = nodeById.get(childId)
        if (child) list.push({ key: `${node.id}>${child.id}`, from: node, to: child, symmetric: false })
      })
    })
    symmetricEdges.forEach(([fromKey, toKey]) => {
      const from = firstNodeByTemplateKey.get(fromKey)
      const to = firstNodeByTemplateKey.get(toKey)
      if (from && to) list.push({ key: `${from.id}~${to.id}`, from, to, symmetric: true })
    })
    return list
  }, [firstNodeByTemplateKey, nodeById, nodes])

  // The world element gets its transform straight from the viewport module.
  useLayoutEffect(() => {
    attachWorld(viewportRef.current, worldRef.current)
    return () => attachWorld(null, null)
  }, [])

  // Size, and an opening zoom that suits the screen: the whole first ring of
  // nodes should fit a phone.
  useLayoutEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const measure = () => setViewportSize(element.clientWidth, element.clientHeight)
    measure()
    const { width, height } = getViewportSize()
    setView({ k: Math.min(1, Math.max(0.6, Math.min(width, height) / 640)) })
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // The frame loop: the simulation at a fixed step, the view's glides, and
  // the follow of a focused card.
  useEffect(() => {
    let frame = 0
    let last = performance.now()
    let accumulator = 0

    const loop = (now: number) => {
      accumulator += Math.min((now - last) / 1000, 0.1)
      last = now
      if (accumulator >= PHYSICS_STEP) {
        tickPhysics(PHYSICS_STEP)
        accumulator = Math.min(accumulator - PHYSICS_STEP, PHYSICS_STEP)
      }

      tickView(now)

      // A focused card keeps its place on the screen even if the simulation
      // moves it: the glide aims at where it is now, and the view follows after.
      const focusedId = focusedCardNodeIdRef.current
      const offset = followOffsetRef.current
      if (focusedId && offset) {
        const node = useGraphStore.getState().nodes.find((candidate) => candidate.id === focusedId)
        if (node) {
          const x = node.position[0] + offset.dx
          const y = node.position[1] + offset.dy
          if (isGliding()) {
            retargetGlide(x, y)
          } else {
            const view = getView()
            if (Math.abs(x - view.x) > 1e-4 || Math.abs(y - view.y) > 1e-4) setView({ x, y })
          }
        }
      }

      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [tickPhysics])

  // Once the root opens, the start hint is over for good.
  if (isRootExpanded && (showStartHint || showStartHintText)) {
    setShowStartHint(false)
    setShowStartHintText(false)
  }

  const isRootExpandedRef = useRef(isRootExpanded)
  useEffect(() => {
    isRootExpandedRef.current = isRootExpanded
  }, [isRootExpanded])
  useEffect(() => {
    const wobble = window.setTimeout(() => {
      if (!isRootExpandedRef.current) setShowStartHint(true)
    }, START_HINT_WOBBLE_DELAY_MS)
    const text = window.setTimeout(() => {
      if (!isRootExpandedRef.current) setShowStartHintText(true)
    }, START_HINT_TEXT_DELAY_MS)
    return () => {
      window.clearTimeout(wobble)
      window.clearTimeout(text)
    }
  }, [])

  // Clear focus when the focused card starts collapsing or disappears.
  useEffect(() => {
    if (!focusedCardNodeId) return
    const node = nodeById.get(focusedCardNodeId)
    if (!node || node.collapsing) setFocusedCardNodeId(null)
  }, [focusedCardNodeId, nodeById, setFocusedCardNodeId])

  // Escape leaves a focused card.
  useEffect(() => {
    if (!focusedCardNodeId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocusedCardNodeId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusedCardNodeId, setFocusedCardNodeId])

  // The glide to a focused card and back, with a whoosh either way.
  const previousFocusedRef = useRef<string | null>(null)
  useEffect(() => {
    const previous = previousFocusedRef.current
    previousFocusedRef.current = focusedCardNodeId
    if (previous === focusedCardNodeId) return

    if (focusedCardNodeId === null) {
      followOffsetRef.current = null
      const saved = savedViewRef.current
      savedViewRef.current = null
      if (previous !== null) playSound('focusOut')
      if (saved) glideTo(saved)
      return
    }

    playSound('focusIn')
    const body = worldRef.current?.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(focusedCardNodeId)}"] .node-body`)
    const node = nodeById.get(focusedCardNodeId)
    if (!body || !node) return

    if (!savedViewRef.current) savedViewRef.current = { ...getView() }

    // The body itself has no size: its parts are placed around the node's
    // point. Fit the whole of them: the title above, the card, its button.
    const parts = [...body.querySelectorAll<HTMLElement>('.card-head, .card, .card-focus')].map((part) =>
      part.getBoundingClientRect(),
    )
    if (parts.length === 0) return
    const rect = {
      left: Math.min(...parts.map((part) => part.left)),
      top: Math.min(...parts.map((part) => part.top)),
      right: Math.max(...parts.map((part) => part.right)),
      bottom: Math.max(...parts.map((part) => part.bottom)),
    }
    const [left, top] = screenToWorld(rect.left, rect.top)
    const [right, bottom] = screenToWorld(rect.right, rect.bottom)
    const { width, height } = getViewportSize()
    const k = Math.min(ZOOM_MAX, (width * FOCUS_FILL) / ((right - left) * UNIT), (height * FOCUS_FILL) / ((bottom - top) * UNIT))
    const x = (left + right) / 2
    const y = (top + bottom) / 2
    followOffsetRef.current = { dx: x - node.position[0], dy: y - node.position[1] }
    glideTo({ x, y, k })
    // The focus animation only depends on the card chosen, not on the layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedCardNodeId])

  const toggleFocus = useCallback(
    (id: string) => setFocusedCardNodeId(useGraphStore.getState().focusedCardNodeId === id ? null : id),
    [setFocusedCardNodeId],
  )

  // ── Panning and pinching on the background ────────────────────────────────
  const isFocused = focusedCardNodeId !== null

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isFocused) return
    const pointers = pointersRef.current
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture(event.pointerId)
    if (pointers.size === 1) setIsPanning(true)
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinchRef.current = { distance: Math.hypot(b.x - a.x, b.y - a.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current
    const previous = pointers.get(event.pointerId)
    if (!previous) return
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.size === 1) {
      panBy(event.clientX - previous.x, event.clientY - previous.y)
      return
    }

    const pinch = pinchRef.current
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()]
      const distance = Math.hypot(b.x - a.x, b.y - a.y)
      const x = (a.x + b.x) / 2
      const y = (a.y + b.y) / 2
      if (pinch.distance > 0) zoomAt(distance / pinch.distance, x, y)
      panBy(x - pinch.x, y - pinch.y)
      pinchRef.current = { distance, x, y }
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current
    pointers.delete(event.pointerId)
    if (pointers.size < 2) pinchRef.current = null
    if (pointers.size === 0) setIsPanning(false)
  }

  // The wheel listener is attached by hand: React's is passive, and the
  // page must not scroll.
  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (focusedCardNodeIdRef.current) return
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
      zoomAt(Math.exp(-delta * WHEEL_ZOOM_RATE), event.clientX, event.clientY)
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [])

  const className = ['viewport', isPanning ? 'is-panning' : '', isFocused ? 'is-focused' : ''].filter(Boolean).join(' ')

  return (
    <div
      ref={viewportRef}
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div ref={worldRef} className="world">
        <svg className="edges" width="1" height="1" aria-hidden="true">
          {edges.map((edge) => {
            const ends = edgeEnds(edge)
            if (!ends) return null
            const highlighted =
              hoveredNodeId !== null && (edge.from.id === hoveredNodeId || edge.to.id === hoveredNodeId)
            const edgeClass = ['edge', edge.symmetric ? 'is-symmetric' : '', highlighted ? 'is-highlighted' : '']
              .filter(Boolean)
              .join(' ')
            return <line key={edge.key} className={edgeClass} x1={ends[0]} y1={ends[1]} x2={ends[2]} y2={ends[3]} />
          })}
        </svg>

        {nodes.map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            language={language}
            isHovered={hoveredNodeId === node.id}
            isFocused={focusedCardNodeId === node.id}
            isWobbling={node.id === 'main' && showStartHint && !reducedMotion}
            onToggleFocus={toggleFocus}
          />
        ))}

      </div>

      {showStartHintText && rootNode && <StartHint text={copy[language].startHint} rootRadius={rootNode.radius ?? 0.5} />}
    </div>
  )
}
