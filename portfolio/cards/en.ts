/**
 * English card content.
 * Each key must match a leaf templateKey in nodes/structure.ts.
 *
 * Keep cards short: a one-line summary, two or three bullets at most, and no
 * implementation details — the point is to give a visitor an idea of the work,
 * not a technical report.
 */

import type { CardContent } from '../types'
import { siteUrl } from '../identity'

export const cardContentEn: Record<string, CardContent> = {
  'exp-internship-1': {
    institutionText: 'IRT SystemX, Palaiseau, 2025',
    summaryText: 'Automated generation of driving scenarios from simulations',
    detailsText: `
- Finding driving situations in traffic simulations, to test self-driving cars
- Part of the European project [SYNERGIES](https://synergies-ccam.eu)
`,
    previewImage: {
      src: 'previews/irt-systemx-atrium.webp',
      aspectRatio: 2,
      alt: 'The atrium of IRT SystemX in Palaiseau',
    },
  },
  'exp-internship-2': {
    institutionText: 'IRISA, LogicA team, 2026',
    summaryText: 'Formalising abstraction between systems and attacks for attack tree synthesis',
    detailsText: `
- Formally relating an attack on an abstract system to its counterparts on more concrete systems
- Deriving libraries of refinements from it, from which attack trees can be synthesised
- Master's internship in the [LogicA](https://www.irisa.fr/en/teams/logica) team, supervised by [Sophie Pinchinat](https://people.irisa.fr/Sophie.Pinchinat/)
`,
    previewImage: {
      src: 'previews/irisa-beaulieu.webp',
      aspectRatio: 2,
      alt: 'The Inria building on the Beaulieu campus in Rennes, home of IRISA',
    },
  },
  phd: {
    institutionText: 'CNRS · IRISA, 2026-2029',
    summaryText: 'PhD on the formal verification of protocols in the presence of associative-commutative operators',
    detailsText: `
- In the [SPICY](https://www.irisa.fr/en/teams/spicy) team at IRISA, in Rennes
- Work on [ProVerif](https://bblanche.gitlabpages.inria.fr/proverif/), an automatic protocol verification tool
- Supervised by [Stéphanie Delaune](https://people.irisa.fr/Stephanie.Delaune/), co-supervised by [Vincent Cheval](https://www.cs.ox.ac.uk/people/vincent.cheval/)
`,
    previewImage: {
      src: 'previews/irisa-beaulieu.webp',
      aspectRatio: 2,
      alt: 'The Inria building on the Beaulieu campus in Rennes, home of IRISA',
    },
  },
  'diploma-1': {
    institutionText: 'INSA Rennes, 2025-2026',
    summaryText: 'Research Master in Computer Science (SIF)',
    detailsText: `
- Joint research master between the University of Rennes, ENS Rennes, CentraleSupélec and INSA Rennes
- [master.irisa.fr](http://master.irisa.fr)
`,
    previewImage: {
      src: 'previews/insa-rennes-batiment.webp',
      aspectRatio: 2,
      alt: 'The INSA Rennes building',
    },
  },
  'diploma-2': {
    institutionText: 'INSA CVL, 2021-2026',
    summaryText: 'Engineering degree, Information Technology Security department',
    detailsText: `
- Two years of integrated prep, then three years of engineering
- Formal methods for cybersecurity option in the fourth year
- Fine arts option for two years
`,
    previewImage: {
      src: 'previews/insa-cvl-entree.webp',
      aspectRatio: 2,
      alt: 'The entrance of INSA Centre Val de Loire',
    },
  },
  'project-portfolio': {
    summaryText: 'This 3D portfolio, to explore like a graph',
    detailsText: `
- The template code is on [GitHub](https://github.com/LePapelier/3D-portfolio-template)
- Live at [${siteUrl}](${siteUrl})
`,
    link: { url: 'https://github.com/LePapelier/3D-portfolio-template' },
  },
  'centurion-paper': {
    summaryText: 'A web app that turns 3D models into paper patterns to cut out, fold and glue',
    detailsText: '',
    previewImage: {
      src: 'previews/paper-centurion.webp',
      aspectRatio: 2,
      brightness: 0.72,
      alt: 'Screenshot of Paper Centurion: an icosahedron unfolded into a print-ready paper pattern',
    },
    link: { url: 'https://paul-laurent.fr/paper-centurion/' },
  },
  'centurion-scrabble': {
    summaryText: 'French Scrabble in the browser, against an AI or with a friend',
    detailsText: '',
    previewImage: {
      src: 'previews/centurion-scrabble.webp',
      aspectRatio: 2,
      alt: 'Screenshot of Centurion Scrabble: a game in progress against the AI',
    },
    link: { url: 'https://paul-laurent.fr/centurion-scrabble/' },
  },
  'centurion-poker': {
    summaryText: 'Texas hold\'em in the browser, against AIs or with friends',
    detailsText: '',
    previewImage: {
      src: 'previews/centurion-poker.webp',
      aspectRatio: 2,
      alt: 'Screenshot of Centurion Poker: a showdown won with a full house',
    },
    link: { url: 'https://paul-laurent.fr/centurion-poker/' },
  },
  'centurion-scheduler': {
    summaryText: 'A puzzle game for learning formal logic',
    detailsText: '',
    previewImage: {
      src: 'previews/centurion-scheduler.webp',
      aspectRatio: 2,
      alt: 'Screenshot of Centurion Scheduler: the state graph of a mutex, with the proof panel',
    },
    link: { url: 'https://paul-laurent.fr/centurion-scheduler/' },
  },
}
