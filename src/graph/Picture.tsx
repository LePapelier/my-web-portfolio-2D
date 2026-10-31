import type { CSSProperties } from 'react'
import type { LabelPicture } from './content'

/** The 3D site's proportions: a pictogram a little under the cap height, a logo a little over. */
const ICON_SCALE = 0.92
const LOGO_SCALE = 1.15

/**
 * A title's pictogram: a Lucide icon drawn as a mask in the ink colour, or a
 * logo shown in shades of grey.
 */
export default function Picture({ picture }: { picture: LabelPicture | null }) {
  if (!picture) return null
  const height = picture.scale ?? (picture.colour ? LOGO_SCALE : ICON_SCALE)
  if (picture.colour) {
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
  const style = { '--icon': `url("${picture.url}")`, height: `${height}em`, width: `${height * picture.aspect}em` } as CSSProperties
  return <span className="pictogram" style={style} aria-hidden="true" />
}
