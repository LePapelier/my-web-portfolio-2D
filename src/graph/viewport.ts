/**
 * The view onto the graph: which point of the plane sits at the centre of the
 * screen, and how big a graph unit is drawn.
 *
 * Panning and zooming happen on every pointer move, so the view lives outside
 * React and is applied straight to the world element's transform. Components
 * that need it read it through `getView`.
 */
import { reducedMotion } from '../lib/motion'

/** Pixels per graph unit at zoom 1. */
export const UNIT = 64

export interface View {
  /** The point of the plane at the centre of the viewport, in graph units. */
  x: number
  y: number
  /** Zoom: screen pixels per UNIT pixels. */
  k: number
}

export const ZOOM_MIN = 0.3
export const ZOOM_MAX = 3
/** The view's centre never leaves this radius around the root, in graph units. */
const MAX_PAN_RADIUS = 7
/** Seconds the view takes to glide to a focused card and back. */
export const FOCUS_DURATION_S = reducedMotion ? 0.3 : 1

const view: View = { x: 0, y: 0, k: 1 }
let worldElement: HTMLElement | null = null
let viewportElement: HTMLElement | null = null
let viewportSize = { width: 1, height: 1 }
let glide: { from: View; to: View; startedAt: number; onDone?: () => void } | null = null
const listeners = new Set<(view: View) => void>()

export function attachWorld(viewport: HTMLElement | null, world: HTMLElement | null) {
  viewportElement = viewport
  worldElement = world
  render()
}

/** Where the viewport sits on the page, so pointer positions can be placed in the plane. */
function getOrigin(): { left: number; top: number } {
  const rect = viewportElement?.getBoundingClientRect()
  return rect ? { left: rect.left, top: rect.top } : { left: 0, top: 0 }
}

export function setViewportSize(width: number, height: number) {
  viewportSize = { width, height }
  render()
}

export function getView(): View {
  return view
}

export function getViewportSize() {
  return viewportSize
}

export function subscribeView(listener: (view: View) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function render() {
  if (!worldElement) return
  const { width, height } = viewportSize
  const scale = view.k * UNIT
  const tx = width / 2 - view.x * scale
  const ty = height / 2 - view.y * scale
  worldElement.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
  listeners.forEach((listener) => listener(view))
}

function clampView(next: View): View {
  const k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next.k))
  const radius = Math.hypot(next.x, next.y)
  const limit = radius > MAX_PAN_RADIUS ? MAX_PAN_RADIUS / radius : 1
  return { x: next.x * limit, y: next.y * limit, k }
}

export function setView(next: Partial<View>) {
  glide = null
  Object.assign(view, clampView({ ...view, ...next }))
  render()
}

/** Shifts the view by a screen-space distance. */
export function panBy(dxPx: number, dyPx: number) {
  const scale = view.k * UNIT
  setView({ x: view.x - dxPx / scale, y: view.y - dyPx / scale })
}

/** Zooms by a factor, keeping the point under the given screen position still. */
export function zoomAt(factor: number, clientX: number, clientY: number) {
  const nextK = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, view.k * factor))
  const applied = nextK / view.k
  if (applied === 1) return
  const [px, py] = screenToWorld(clientX, clientY)
  setView({ x: px + (view.x - px) / applied, y: py + (view.y - py) / applied, k: nextK })
}

/** The point of the plane under a screen position. */
export function screenToWorld(clientX: number, clientY: number): [number, number] {
  const scale = view.k * UNIT
  const { width, height } = viewportSize
  const origin = getOrigin()
  return [
    view.x + (clientX - origin.left - width / 2) / scale,
    view.y + (clientY - origin.top - height / 2) / scale,
  ]
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

/** Glides to a view over the focus duration. */
export function glideTo(target: View, onDone?: () => void) {
  glide = { from: { ...view }, to: clampView(target), startedAt: performance.now(), onDone }
}

export function isGliding() {
  return glide !== null
}

/** Moves the end of a glide in progress, for a target that drifts. */
export function retargetGlide(x: number, y: number) {
  if (!glide) return
  glide.to = clampView({ ...glide.to, x, y })
}

/** Advances a glide in progress; called once a frame. */
export function tickView(now: number) {
  if (!glide) return
  const t = Math.min(1, (now - glide.startedAt) / (FOCUS_DURATION_S * 1000))
  const e = easeInOut(t)
  const { from, to } = glide
  Object.assign(view, {
    x: from.x + (to.x - from.x) * e,
    y: from.y + (to.y - from.y) * e,
    k: from.k + (to.k - from.k) * e,
  })
  render()
  if (t >= 1) {
    const done = glide.onDone
    glide = null
    done?.()
  }
}
