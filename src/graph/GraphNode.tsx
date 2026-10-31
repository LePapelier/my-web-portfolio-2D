import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import { useGraphStore } from '../store/useGraphStore'
import type { Language, Node } from '../store/graph/types'
import { pitchFromKey, playSound, staggerFromKey } from '../lib/sound'
import { UNIT, getView } from './viewport'
import { setNodeBox } from '../store/graph/layout'
import {
  copy,
  emailLetterSvgPath,
  emailPrivateSvgPath,
  getCardContent,
  getLabelPicture,
  getNodeLookup,
  getNodeSubtitle,
} from './content'
import { GithubMark } from '../components/Icons'
import CardNode from './CardNode'
import Picture from './Picture'

/**
 * Where a disc's title goes: across the ray from the root, since the edges
 * come in along it from the parent and leave along it towards the children.
 * Above for a node to the left or right of the centre, beside it for one
 * above or below.
 */
type LabelSide = 'above' | 'left' | 'right'

function labelSideFor(position: [number, number], isMain: boolean): LabelSide {
  if (isMain) return 'above'
  const [x, y] = position
  if (Math.abs(x) >= Math.abs(y)) return 'above'
  return x >= 0 ? 'right' : 'left'
}

interface GraphNodeProps {
  node: Node
  language: Language
  isHovered: boolean
  isFocused: boolean
  isWobbling: boolean
  onToggleFocus: (id: string) => void
}

/** The contact leaf: a letter and the address, drawn at build time from a secret. */
function EmailLeaf({ language }: { language: Language }) {
  const text = copy[language]
  const [missing, setMissing] = useState(false)
  return (
    <div className="leaf email is-disabled">
      <img className="letter" src={emailLetterSvgPath} alt="" draggable={false} />
      {missing ? (
        <span className="address-missing">{text.emailMissing}</span>
      ) : (
        <img
          className="address"
          src={emailPrivateSvgPath}
          alt={text.email}
          draggable={false}
          onError={() => setMissing(true)}
        />
      )}
    </div>
  )
}

function GraphNode({ node, language, isHovered, isFocused, isWobbling, onToggleFocus }: GraphNodeProps) {
  const { id, templateKey, label, visualType, href, expanding, expandStartAt, collapsing, collapseRole, collapseStartAt, expanded, position } = node
  const expandNode = useGraphStore((state) => state.expandNode)
  const setHoveredNode = useGraphStore((state) => state.setHoveredNode)
  const setFocusedCardNodeId = useGraphStore((state) => state.setFocusedCardNodeId)
  const setLastActivatedNodeId = useGraphStore((state) => state.setLastActivatedNodeId)
  const text = copy[language]

  const cardContent = getCardContent(templateKey, language)
  const isMain = id === 'main'
  const isEmail = templateKey === 'mail'
  const isGithub = templateKey === 'github'
  const isDisc = visualType === 'disc'
  const isCard = !isDisc && !!cardContent && !isEmail
  const isLocation = templateKey === 'about-location'
  // A plain leaf leads somewhere: the page chosen for it, or a web search.
  const isLookup = !isDisc && !isCard && !isEmail && !isGithub && !href && !isLocation
  const lookup = getNodeLookup(templateKey, language)
  const resolvedHref =
    href ?? (isLookup ? (lookup ?? `https://www.google.com/search?q=${encodeURIComponent(label)}`) : undefined)
  const subtitle = getNodeSubtitle(templateKey, language)
  const picture = isMain ? null : getLabelPicture(templateKey)
  const radius = node.radius ?? 0.3
  const isReopenable = !!collapsing && collapseRole === 'source'
  const isInert = !!collapsing && !isReopenable

  // Timed states: held back until its turn in the wave, and folding away at
  // its own time in the cascade. Both are read against a clock kept in state,
  // which a timer advances when the next moment comes.
  const [now, setNow] = useState(() => Date.now())
  const waitUntil = expanding && expandStartAt ? expandStartAt : 0
  const foldAt = collapsing && collapseRole === 'target' ? (collapseStartAt ?? 0) : Infinity
  const isWaiting = now < waitUntil
  const isFolding = now >= foldAt
  useEffect(() => {
    const due = Math.min(waitUntil > now ? waitUntil : Infinity, foldAt > now ? foldAt : Infinity)
    if (!Number.isFinite(due)) return
    const timeout = window.setTimeout(() => setNow(Date.now()), Math.max(0, due - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [foldAt, now, waitUntil])

  // One bubble per node as it pops out, so an expansion reads as a little
  // burst following the spawn wave rather than a single blip.
  const hasPlayedSpawnRef = useRef(false)
  useEffect(() => {
    if (!expanding || isWaiting || hasPlayedSpawnRef.current) return
    hasPlayedSpawnRef.current = true
    playSound('bubble', { pitch: pitchFromKey(id) })
  }, [expanding, id, isWaiting])

  // …and a ping as it folds away, spread a little among siblings, who
  // otherwise all leave on the same beat.
  const hasPlayedCollapseRef = useRef(false)
  useEffect(() => {
    if (!collapsing || collapseRole !== 'target' || hasPlayedCollapseRef.current) return
    hasPlayedCollapseRef.current = true
    playSound('collapse', { pitch: pitchFromKey(id), delay: staggerFromKey(id) })
  }, [collapseRole, collapsing, id])

  // A card closes as its branch folds. State that follows a prop is reset
  // while rendering, as React recommends, rather than from an effect.
  const [isCardOpen, setIsCardOpen] = useState(false)
  const [wasCollapsing, setWasCollapsing] = useState(!!collapsing)
  if (wasCollapsing !== !!collapsing) {
    setWasCollapsing(!!collapsing)
    if (collapsing) setIsCardOpen(false)
  }

  const activate = () => {
    if (isReopenable) {
      expandNode(id)
      return
    }
    if (isInert) return
    if (isCard) {
      playSound(isCardOpen ? 'cardClose' : 'cardOpen')
      // A card closing leaves focus with it.
      if (isCardOpen && isFocused) setFocusedCardNodeId(null)
      setIsCardOpen(!isCardOpen)
      setLastActivatedNodeId(id)
      return
    }
    if (isDisc) expandNode(id)
  }

  /** A leaf is a link: the browser opens it, with a sound. */
  const onLinkClick = (event: MouseEvent) => {
    if (isInert) {
      event.preventDefault()
      return
    }
    playSound('link')
  }

  /** A press on a node is for the node: the viewport must not start panning. */
  const onPointerDown = (event: PointerEvent) => event.stopPropagation()

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    activate()
  }

  const onPointerEnter = () => {
    if (isInert || isFocused) return
    setHoveredNode(id)
    playSound('hover')
  }

  const onPointerLeave = () => {
    if (useGraphStore.getState().hoveredNodeId === id) setHoveredNode(null)
  }

  // Tells the layout how big this node is drawn, around its point, and again
  // whenever that changes: a card opening, a picture arriving, a new label.
  const bodyRef = useRef<HTMLDivElement | null>(null)
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) {
      setNodeBox(id, null)
      return
    }
    const measure = () => {
      const origin = body.getBoundingClientRect()
      const scale = getView().k * UNIT
      let left = 0
      let top = 0
      let right = 0
      let bottom = 0
      for (const part of body.querySelectorAll<HTMLElement>('.disc, .disc-label, .leaf, .card-head, .card-chip, .card, .card-focus')) {
        const rect = part.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue
        left = Math.min(left, (rect.left - origin.left) / scale)
        top = Math.min(top, (rect.top - origin.top) / scale)
        right = Math.max(right, (rect.right - origin.left) / scale)
        bottom = Math.max(bottom, (rect.bottom - origin.top) / scale)
      }
      setNodeBox(id, { left, top, right, bottom })
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const child of body.children) observer.observe(child)
    const images = body.querySelectorAll('img')
    images.forEach((image) => image.addEventListener('load', measure))
    return () => {
      observer.disconnect()
      images.forEach((image) => image.removeEventListener('load', measure))
    }
  }, [id, isWaiting, isCardOpen, label, language, expanded])
  useEffect(() => () => setNodeBox(id, null), [id])

  if (isWaiting) return null

  const bodyClass = [
    'node-body',
    isCard ? 'is-card' : '',
    isMain ? '' : 'is-spawning',
    isFolding ? 'is-collapsing' : '',
    isHovered && !isFocused && !isInert ? 'is-hovered' : '',
  ]
    .filter(Boolean)
    .join(' ')

  let body
  if (isDisc) {
    const diameter = radius * 2 * UNIT
    const ringWidth = expanded ? (radius - Math.max(radius * 0.58, 0.03)) * UNIT : 0
    const side = labelSideFor(position, isMain)
    const gap = radius * UNIT + (isMain ? 26 : 20)
    const labelStyle = side === 'above' ? { top: -gap } : side === 'left' ? { left: -gap } : { left: gap }
    body = (
      <>
        <div
          className={['disc', expanded ? 'is-open' : '', isWobbling && !expanded ? 'is-wobbling' : ''].filter(Boolean).join(' ')}
          role="button"
          tabIndex={0}
          aria-expanded={!!expanded}
          aria-label={`${expanded ? text.collapse : text.expand} : ${label}`}
          style={{ width: diameter, height: diameter, borderWidth: ringWidth }}
          onClick={activate}
          onKeyDown={onKeyDown}
        />
        <div className={`disc-label is-${side}`} style={labelStyle}>
          <span className={`title${isMain ? ' is-main' : ''}`}>
            <Picture picture={picture} />
            {label}
          </span>
        </div>
      </>
    )
  } else if (isCard && cardContent) {
    body = (
      <CardNode
        id={id}
        label={label}
        picture={picture}
        content={cardContent}
        language={language}
        isOpen={isCardOpen}
        isFocused={isFocused}
        onToggle={activate}
        onToggleFocus={onToggleFocus}
      />
    )
  } else if (isEmail) {
    body = <EmailLeaf language={language} />
  } else if (isGithub) {
    body = (
      <a className="leaf" href={href} target="_blank" rel="noopener noreferrer" onClick={onLinkClick}>
        <span className="title">
          <GithubMark />
          {label}
        </span>
        <span className="cta">{text.open}</span>
      </a>
    )
  } else if (resolvedHref) {
    body = (
      <a className="leaf" href={resolvedHref} target="_blank" rel="noopener noreferrer" onClick={onLinkClick}>
        {subtitle && <span className="subtitle">{subtitle}</span>}
        <span className="title">
          <Picture picture={picture} />
          {label}
        </span>
        <span className="cta">{isLookup ? (lookup ? text.sheet : text.search) : text.open}</span>
      </a>
    )
  } else {
    body = (
      <div className="leaf is-disabled">
        {subtitle && <span className="subtitle">{subtitle}</span>}
        <span className="title">
          <Picture picture={picture} />
          {label}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`node${isFocused ? ' is-focused-card' : ''}`}
      data-node-id={id}
      style={{ transform: `translate(${position[0] * UNIT}px, ${position[1] * UNIT}px)` }}
    >
      <div
        ref={bodyRef}
        className={bodyClass}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
      >
        {body}
      </div>
    </div>
  )
}

export default memo(GraphNode)
