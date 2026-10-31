/**
 * French card content.
 * Each key must match a leaf templateKey in nodes/structure.ts.
 *
 * Keep cards short: a one-line summary, two or three bullets at most, and no
 * implementation details — the point is to give a visitor an idea of the work,
 * not a technical report.
 */

import type { CardContent } from '../types'
import { siteUrl } from '../identity'

export const cardContentFr: Record<string, CardContent> = {
  'exp-internship-1': {
    institutionText: 'IRT SystemX, Palaiseau, 2025',
    summaryText: 'Génération automatisée de scénarios de conduite à partir de simulations',
    detailsText: `
- Repérer des situations de conduite dans des simulations de trafic, pour tester des véhicules autonomes
- Dans le cadre du projet européen [SYNERGIES](https://synergies-ccam.eu)
`,
    previewImage: {
      src: 'previews/irt-systemx-atrium.webp',
      aspectRatio: 2,
      alt: 'Le hall de l’IRT SystemX, à Palaiseau',
    },
  },
  'exp-internship-2': {
    institutionText: 'IRISA, équipe LogicA, 2026',
    summaryText: "Formaliser l'abstraction entre systèmes et attaques pour la synthèse d'arbres d'attaque",
    detailsText: `
- Relier formellement une attaque sur un système abstrait à ses déclinaisons sur des systèmes plus concrets
- En tirer des bibliothèques de raffinements, à partir desquelles synthétiser des arbres d'attaque
- Stage de master dans l'équipe [LogicA](https://www.irisa.fr/equipes/logica), encadré par [Sophie Pinchinat](https://people.irisa.fr/Sophie.Pinchinat/)
`,
    previewImage: {
      src: 'previews/irisa-beaulieu.webp',
      aspectRatio: 2,
      alt: "Le bâtiment Inria du campus de Beaulieu, à Rennes, où se trouve l'IRISA",
    },
  },
  phd: {
    institutionText: 'CNRS · IRISA, 2026-2029',
    summaryText: 'Thèse de doctorat sur la vérification formelle de protocoles en présence d\'opérateurs associatifs-commutatifs',
    detailsText: `
- Dans l'équipe [SPICY](https://www.irisa.fr/equipes/spicy) de l'IRISA, à Rennes
- Travail sur [ProVerif](https://bblanche.gitlabpages.inria.fr/proverif/), un outil de vérification automatique de protocoles
- Dirigée par [Stéphanie Delaune](https://people.irisa.fr/Stephanie.Delaune/) et co-encadrée par [Vincent Cheval](https://www.cs.ox.ac.uk/people/vincent.cheval/)
`,
    previewImage: {
      src: 'previews/irisa-beaulieu.webp',
      aspectRatio: 2,
      alt: "Le bâtiment Inria du campus de Beaulieu, à Rennes, où se trouve l'IRISA",
    },
  },
  'diploma-1': {
    institutionText: 'INSA Rennes, 2025-2026',
    summaryText: 'Master Sciences InFormatiques (SIF)',
    detailsText: `
- Master recherche commun à l'Université de Rennes, l'ENS Rennes, CentraleSupélec et l'INSA Rennes
- [master.irisa.fr](http://master.irisa.fr)
`,
    previewImage: {
      src: 'previews/insa-rennes-batiment.webp',
      aspectRatio: 2,
      alt: 'Le bâtiment de l’INSA Rennes',
    },
  },
  'diploma-2': {
    institutionText: 'INSA CVL, 2021-2026',
    summaryText: "Diplôme d'ingénieur, département Sécurité des Technologies de l'Information",
    detailsText: `
- Deux ans de prépa intégrée puis trois ans de cycle ingénieur
- Option méthodes formelles pour la cybersécurité en 4e année
- Option arts plastiques pendant deux ans
`,
    previewImage: {
      src: 'previews/insa-cvl-entree.webp',
      aspectRatio: 2,
      alt: 'L’entrée de l’INSA Centre Val de Loire',
    },
  },
  'project-portfolio': {
    summaryText: 'Ce portfolio en 3D, à parcourir comme un graphe',
    detailsText: `
- Le code du modèle est sur [GitHub](https://github.com/LePapelier/3D-portfolio-template)
- En ligne sur [${siteUrl}](${siteUrl})
`,
    link: { url: 'https://github.com/LePapelier/3D-portfolio-template' },
  },
  'centurion-paper': {
    summaryText: 'Une application web pour convertir des modèles 3D en patrons de papier à découper, plier et coller',
    detailsText: '',
    previewImage: {
      src: 'previews/paper-centurion.webp',
      aspectRatio: 2,
      brightness: 0.72,
      alt: "Capture de Paper Centurion : un icosaèdre déplié en patron de papier prêt à imprimer",
    },
    link: { url: 'https://paul-laurent.fr/paper-centurion/' },
  },
  'centurion-scrabble': {
    summaryText: 'Un Scrabble en français, à jouer dans le navigateur contre une IA ou à deux',
    detailsText: '',
    previewImage: {
      src: 'previews/centurion-scrabble.webp',
      aspectRatio: 2,
      alt: 'Capture de Centurion Scrabble : une partie en cours contre l\'IA',
    },
    link: { url: 'https://paul-laurent.fr/centurion-scrabble/' },
  },
  'centurion-poker': {
    summaryText: 'Un Texas hold\'em en français, à jouer dans le navigateur contre des IA ou entre amis',
    detailsText: '',
    previewImage: {
      src: 'previews/centurion-poker.webp',
      aspectRatio: 2,
      alt: 'Capture de Centurion Poker : un abattage remporté avec un full',
    },
    link: { url: 'https://paul-laurent.fr/centurion-poker/' },
  },
  'centurion-scheduler': {
    summaryText: 'Un jeu de réflexion pour apprendre la logique formelle',
    detailsText: '',
    previewImage: {
      src: 'previews/centurion-scheduler.webp',
      aspectRatio: 2,
      alt: 'Capture de Centurion Scheduler : le graphe des états d\'un mutex, avec le panneau de preuve',
    },
    link: { url: 'https://paul-laurent.fr/centurion-scheduler/' },
  },
}
