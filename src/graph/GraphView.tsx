import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useGraphStore } from '../store/useGraphStore'
import type { Node } from '../store/graph/types'
import { computeTargets, getBoxesVersion, getNodeBox, subscribeBoxes } from '../store/graph/layout'
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

/** Milliseconds of stillness before the root starts to beckon, then to say so. */
const START_HINT_WOBBLE_DELAY_MS = 5000
const START_HINT_TEXT_DELAY_MS = 10000
/** Share of the viewport a focused card fills. */
const FOCUS_FILL = 0.9
/** Room kept around the tree when the view is fitted to it, in graph units. */
const FIT_PADDING = 0.6
/** Milliseconds the fit waits for the drawings to settle before gliding. */
const FIT_DELAY_MS = 120
/** The fit never zooms in past this: a small tree stays at its natural size. */
const FIT_MAX_ZOOM = 1
/** Nor out past this: rather than shrink the tree to a thumbnail, the view
 *  settles on the branch that was just opened. */
const FIT_MIN_ZOOM = 0.45
/** Wheel: one notch of 100 zooms by about 16%. */
const WHEEL_ZOOM_RATE = 0.0015

interface Edge {
  key: string
  from: Node
  to: Node
}

/** How far an edge stops short of a leaf's centre, so it ends under its title. */
const LEAF_INSET = 0.55

/** Trims an edge so it stops at the rim of a disc or the edge of a leaf. */
function edgeEnds(edge: Edge): [number, number, number, number] | null {
  const [x1, y1] = edge.from.position
  const [x2, y2] = edge.to.position
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy)
  const fromInset = edge.from.visualType === 'disc' ? (edge.from.radius ?? 0) : LEAF_INSET
  const toInset = edge.to.visualType === 'disc' ? (edge.to.radius ?? 0) : LEAF_INSET
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
  const tickLayout = useGraphStore((state) => state.tickLayout)

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

  // The tree's own edges only: the 3D site's extra, cross-branch edges would
  // have to cross the others, and this layout promises none do.
  const edges = useMemo(() => {
    const list: Edge[] = []
    nodes.forEach((node) => {
      node.childrenIds?.forEach((childId) => {
        const child = nodeById.get(childId)
        if (child) list.push({ key: `${node.id}>${child.id}`, from: node, to: child })
      })
    })
    return list
  }, [nodeById, nodes])

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

  // The frame loop: the nodes' glides to their places, the view's glides,
  // and the follow of a focused card.
  useEffect(() => {
    let frame = 0
    let last = performance.now()

    const loop = (now: number) => {
      tickLayout((now - last) / 1000)
      last = now

      tickView(now)

      // A focused card keeps its place on the screen even if the layout moves
      // it: the glide aims at where it is now, and the view follows after.
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
  }, [tickLayout])

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

  // Whenever a branch opens or closes, or a node's drawing changes size, the
  // view glides so that the whole tree, where its nodes are heading, fits on
  // the screen. When that would shrink it too far, the view settles instead
  // on the node just opened and its children.
  const structureKey = nodes.map((node) => node.id).join('|')
  const boxesVersion = useSyncExternalStore(subscribeBoxes, getBoxesVersion)
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (focusedCardNodeIdRef.current) return
      const state = useGraphStore.getState()
      const targets = computeTargets(state.nodes)
      const { width, height } = getViewportSize()

      const fit = (ids: Iterable<string>) => {
        let left = Infinity
        let top = Infinity
        let right = -Infinity
        let bottom = -Infinity
        for (const id of ids) {
          const target = targets.get(id)
          if (!target) continue
          const box = getNodeBox(id) ?? { left: -0.5, top: -0.5, right: 0.5, bottom: 0.5 }
          left = Math.min(left, target[0] + box.left)
          top = Math.min(top, target[1] + box.top)
          right = Math.max(right, target[0] + box.right)
          bottom = Math.max(bottom, target[1] + box.bottom)
        }
        if (!Number.isFinite(left)) return null
        const spanX = right - left + FIT_PADDING * 2
        const spanY = bottom - top + FIT_PADDING * 2
        const k = Math.min(FIT_MAX_ZOOM, width / (spanX * UNIT), height / (spanY * UNIT))
        return { x: (left + right) / 2, y: (top + bottom) / 2, k }
      }

      const whole = fit(targets.keys())
      if (!whole) return
      if (whole.k >= FIT_MIN_ZOOM) {
        glideTo(whole)
        return
      }
      const activated = state.nodes.find((node) => node.id === state.lastActivatedNodeId)
      const branch = activated ? fit([activated.id, ...(activated.expanded ? (activated.childrenIds ?? []) : [])]) : null
      const view = branch ?? whole
      glideTo({ ...view, k: Math.max(FIT_MIN_ZOOM, view.k) })
    }, FIT_DELAY_MS)
    return () => window.clearTimeout(timeout)
  }, [structureKey, boxesVersion])

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
            const edgeClass = highlighted ? 'edge is-highlighted' : 'edge'
            return (
              <line
                key={edge.key}
                className={edgeClass}
                x1={ends[0] * UNIT}
                y1={ends[1] * UNIT}
                x2={ends[2] * UNIT}
                y2={ends[3] * UNIT}
              />
            )
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
