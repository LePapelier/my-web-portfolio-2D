import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useGraphStore } from '../store/useGraphStore'
import { screenToWorld } from './viewport'

interface DragState {
  pointerId: number
  startX: number
  startY: number
  /** Where the node sits relative to the pointer, in graph units. */
  offsetX: number
  offsetY: number
  dragging: boolean
}

/**
 * Lets a node be dragged around the plane. A press that moves less than the
 * threshold stays a click; past it, the node follows the pointer and the
 * click that ends the press is swallowed.
 */
export function useNodeDrag(id: string, disabled: boolean, thresholdPx: number) {
  const stateRef = useRef<DragState | null>(null)
  const suppressClickRef = useRef(false)
  const disabledRef = useRef(disabled)
  useEffect(() => {
    disabledRef.current = disabled
  }, [disabled])

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    // The viewport pans on presses that reach it: a press on a node must not.
    event.stopPropagation()
    suppressClickRef.current = false
    if (disabledRef.current) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const node = useGraphStore.getState().nodes.find((candidate) => candidate.id === id)
    if (!node) return
    const [wx, wy] = screenToWorld(event.clientX, event.clientY)
    stateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: node.position[0] - wx,
      offsetY: node.position[1] - wy,
      dragging: false,
    }
    try {
      ;(event.target as Element).setPointerCapture(event.pointerId)
    } catch {
      // Some targets refuse capture; the window listeners still follow the pointer.
    }
  }

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const state = stateRef.current
      if (!state || event.pointerId !== state.pointerId) return

      if (!state.dragging) {
        if (Math.hypot(event.clientX - state.startX, event.clientY - state.startY) < thresholdPx) return
        if (disabledRef.current) return
        state.dragging = true
        suppressClickRef.current = true
        useGraphStore.getState().startDragging(id)
        document.body.style.cursor = 'grabbing'
      }

      const [wx, wy] = screenToWorld(event.clientX, event.clientY)
      useGraphStore.getState().moveNode(id, [wx + state.offsetX, wy + state.offsetY])
    }

    const onUp = (event: PointerEvent) => {
      const state = stateRef.current
      if (!state || event.pointerId !== state.pointerId) return
      stateRef.current = null
      if (state.dragging) {
        useGraphStore.getState().stopDragging()
        document.body.style.cursor = ''
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      if (stateRef.current?.dragging) {
        useGraphStore.getState().stopDragging()
        document.body.style.cursor = ''
      }
    }
  }, [id, thresholdPx])

  /** True once per drag: the click that ends it is not a click. */
  const consumeSuppressedClick = () => {
    const suppressed = suppressClickRef.current
    suppressClickRef.current = false
    return suppressed
  }

  return { onPointerDown, consumeSuppressedClick }
}
