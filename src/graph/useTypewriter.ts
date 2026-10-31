import { useEffect, useMemo, useState } from 'react'

/**
 * Text typed out as on a keyboard, the 3D site's way: each character waits
 * for the hand that types it to get there, so a run of letters under the
 * same hand comes slower than letters that alternate, and a far key takes
 * a little longer than a near one.
 */

type Hand = 'left' | 'right'

const HOME_BY_HAND: Record<Hand, [number, number]> = {
  left: [3.25, 1],
  right: [6.75, 1],
}

const BASE_KEY_DELAY_MS = 8
const DISTANCE_DELAY_FACTOR_MS = 6
const PRESS_OVERHEAD_MS = 5
const MIN_VISIBLE_STEP_MS = 6
const SPACE_DELAY_MS = 7
const UNKNOWN_CHAR_DELAY_MS = 10
const KEYBOARD_MID_X = 5
const keyboardRows = [
  { keys: '`1234567890-=', y: 0, xOffset: 0 },
  { keys: 'qwertyuiop[]\\', y: 1, xOffset: 0.35 },
  { keys: "asdfghjkl;'", y: 2, xOffset: 0.55 },
  { keys: 'zxcvbnm,./', y: 3, xOffset: 0.95 },
]

const KEY_POSITION_BY_CHAR = (() => {
  const map = new Map<string, [number, number]>()
  keyboardRows.forEach((row) => {
    Array.from(row.keys).forEach((key, index) => {
      map.set(key, [row.xOffset + index, row.y])
      map.set(key.toUpperCase(), [row.xOffset + index, row.y])
    })
  })
  return map
})()

function distance(a: [number, number], b: [number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

function pickHand(char: string, keyPos?: [number, number]): Hand {
  if (keyPos) return keyPos[0] <= KEYBOARD_MID_X ? 'left' : 'right'
  if (char === ' ') return 'left'
  return 'right'
}

/** When each character of the text shows up, in milliseconds from the start. */
export function buildRevealSchedule(text: string): number[] {
  if (!text.length) return []

  const handReadyAt: Record<Hand, number> = { left: 0, right: 0 }
  const handCursor: Record<Hand, [number, number]> = { left: HOME_BY_HAND.left, right: HOME_BY_HAND.right }
  let previousRevealAt = 0
  const revealAt: number[] = []

  Array.from(text).forEach((char, index) => {
    const keyPos = KEY_POSITION_BY_CHAR.get(char)
    const hand = pickHand(char, keyPos)

    let movementDelay = UNKNOWN_CHAR_DELAY_MS
    if (char === ' ') movementDelay = SPACE_DELAY_MS
    else if (keyPos) movementDelay = BASE_KEY_DELAY_MS + distance(handCursor[hand], keyPos) * DISTANCE_DELAY_FACTOR_MS

    const readyAt = handReadyAt[hand] + movementDelay
    const revealTime = Math.max(previousRevealAt + MIN_VISIBLE_STEP_MS, readyAt)
    revealAt[index] = revealTime
    previousRevealAt = revealTime
    handReadyAt[hand] = revealTime + PRESS_OVERHEAD_MS
    if (keyPos) handCursor[hand] = keyPos
  })

  return revealAt
}

/**
 * How many characters of the text are typed so far: none until `active`,
 * then more and more, and all of them once typing is done. Typing starts
 * over from nothing whenever it is switched off and on again.
 */
export function useTypewriter(text: string, active: boolean, delayMs = 0): number {
  const [visible, setVisible] = useState(0)
  const schedule = useMemo(() => buildRevealSchedule(text), [text])

  useEffect(() => {
    if (!active || !schedule.length) return
    const startAt = performance.now() + delayMs
    let frame = 0

    const tick = () => {
      const elapsed = performance.now() - startAt
      let count = 0
      while (count < schedule.length && schedule[count] <= elapsed) count += 1
      setVisible(count)
      if (count < schedule.length) frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(frame)
      // Wiped from the cleanup, so the next run starts from nothing.
      setVisible(0)
    }
  }, [active, delayMs, schedule])

  return visible
}
