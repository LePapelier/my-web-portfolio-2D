import type { CSSProperties } from 'react'
import type { LabelPicture } from './content'

/** A logo sits a little taller than the cap height, as on the 3D site. */
const LOGO_SCALE = 1.15

/**
 * A title's logo: in its own colours, or, for a monochrome one, drawn as a
 * mask in the ink colour, so it is black on paper and white on slate.
 */
export default function Picture({ picture }: { picture: LabelPicture | null }) {
  if (!picture) return null
  const height = picture.scale ?? LOGO_SCALE
  if (picture.ink) {
    const style = { '--icon': `url("${picture.url}")`, height: `${height}em`, width: `${height * picture.aspect}em` } as CSSProperties
    return <span className="pictogram" style={style} aria-hidden="true" />
  }
  return (
    <img
      className="logo"
      src={picture.url}
      alt=""
      style={{ height: `${height}em`, aspectRatio: picture.aspect }}
      draggable={false}
    />
  )
}
