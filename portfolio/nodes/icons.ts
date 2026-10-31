/**
 * Pictogramme affiché devant le titre de chaque nœud, par templateKey.
 *
 * Deux sortes :
 *   - un nom d'icône Lucide (https://lucide.dev, licence ISC) : `npm run icons`
 *     la recopie en SVG monochrome blanc dans public/icons/, et elle prend la
 *     couleur du titre ;
 *   - une petite image en couleurs, déjà dans public/icons/, avec ses
 *     proportions (largeur sur hauteur) et, au besoin, sa hauteur en
 *     fraction de la taille du texte : un logo, qui garde ses couleurs ;
 *     avec `ink`, un logo monochrome sur fond transparent, dessiné dans la
 *     couleur du texte ; avec `darkImage`, une variante pour le thème sombre
 *     (un logo dont une partie est noire, par exemple).
 *
 * Un nœud absent de cette liste garde l'emoji choisi par getLabelIcon.
 */
export type LabelIcon =
  | string
  | { image: string; aspect: number; scale?: number; ink?: boolean; darkImage?: string }

export const labelIconByTemplateKey: Record<string, LabelIcon> = {
  about: 'user-round',
  // Le centurion des jeux, la tuile C du Scrabble, le jeton C du poker.
  projects: { image: 'centurion.webp', aspect: 200 / 264, scale: 1.75 },
  experience: 'briefcase',
  'about-story': 'route',
  teaching: 'book-open-text',
  'teaching-logic': 'sigma',
  'teaching-algorithms': 'workflow',
  'teaching-algorithmic-methods': 'git-fork',
  'teaching-programming': 'code',
  'teaching-computability': 'infinity',
  'about-location': 'map-pin',
  // Le logo de la thèse : bouclier, cadenas et piment.
  phd: { image: 'these.webp', aspect: 216 / 264, scale: 1.6 },
  // Le logo du master SIF, monochrome : il prend la couleur du texte (`ink`).
  'diploma-1': { image: 'sif.png', aspect: 1, scale: 1.1, ink: true },
  // Le logo INSA, rouge et gris, devant le diplôme d'ingénieur.
  'diploma-2': { image: 'insa.webp', aspect: 895 / 360, scale: 0.8 },
  'centurion-paper': 'scissors',
  'centurion-scrabble': { image: 'scrabble-tile.svg', aspect: 1 },
  'centurion-poker': { image: 'poker-chip.svg', aspect: 1 },
  'centurion-scheduler': 'cog',
  'project-portfolio': 'orbit',
  // Le logo de l'IRISA, en bleu.
  'exp-internship-2': { image: 'irisa.png', aspect: 0.82, scale: 1.3 },
  // Le logo de l'IRT SystemX : un S noir, blanc sur le thème sombre, et un X bleu.
  'exp-internship-1': { image: 'systemx.png', aspect: 1, scale: 1.05, darkImage: 'systemx-dark.png' },
}

/** The Lucide icons to generate. */
export const labelIconNames: string[] = Object.values(labelIconByTemplateKey).filter(
  (icon): icon is string => typeof icon === 'string',
)
