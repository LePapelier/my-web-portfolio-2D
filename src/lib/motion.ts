/**
 * Whether the visitor has asked their system for less motion ("Reduce
 * motion" on macOS and iOS, "Show animations" off on Windows and Android).
 *
 * When they have, the graph drops what moves for its own sake (the main
 * node's idle wobble, the pulsing start hint) and shortens the glide to a
 * focused card. Everything the visitor does still answers; only the flourish
 * goes.
 *
 * Read once at load: the setting is rarely changed mid-visit, and a reload
 * picks it up.
 */
export const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
