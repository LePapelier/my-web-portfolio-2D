import type { LabelPicture } from './content'

/** A logo sits a little taller than the cap height, as on the 3D site. */
const LOGO_SCALE = 1.15

/** A title's logo, in its own colours. */
export default function Picture({ picture }: { picture: LabelPicture | null }) {
  if (!picture) return null
  const height = picture.scale ?? LOGO_SCALE
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
