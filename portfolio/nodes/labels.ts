/**
 * Bilingual display labels for every node in the graph.
 *
 * Keys are the templateKey values used throughout the app.
 * Add a key here whenever you add a new node to structure.ts.
 */

import type { Language } from '../types'
import { fullName } from '../identity'

export const mainNodeLabel: Record<Language, string> = {
  en: fullName,
  fr: fullName,
}

export const nodeLabels: Record<Language, Record<string, string>> = {
  en: {
    about: 'Profile',
    projects: 'Centurion suite',
    experience: 'Experience',
    mail: 'Contact',
    github: 'GitHub',
    'about-story': 'My background',
    teaching: 'Teaching',
    'teaching-logic': 'Formal logic',
    'teaching-algorithms': 'Algorithms',
    'teaching-algorithmic-methods': 'Algorithmic methods',
    'teaching-programming': 'Programming',
    'teaching-computability': 'Computability',
    'about-location': 'Rennes, France',
    phd: 'PhD',
    'diploma-1': 'Research master',
    'diploma-2': 'Engineering degree',
    'centurion-paper': 'Paper Centurion',
    'centurion-scrabble': 'Centurion Scrabble',
    'centurion-poker': 'Centurion Poker',
    'centurion-scheduler': 'Centurion Scheduler',
    'project-portfolio': 'Interactive web portfolio',
    'exp-internship-2': 'M2 internship',
    'exp-internship-1': 'M1 internship',
  },
  fr: {
    about: 'À propos',
    projects: 'Suite Centurion',
    experience: 'Expérience',
    mail: 'Contact',
    github: 'GitHub',
    'about-story': 'Mon parcours',
    teaching: 'Enseignements',
    'teaching-logic': 'Logique formelle',
    'teaching-algorithms': 'Algorithmique',
    'teaching-algorithmic-methods': 'Méthodes algorithmiques',
    'teaching-programming': 'Programmation',
    'teaching-computability': 'Calculabilité',
    'about-location': 'Basé à Rennes',
    phd: 'Doctorat',
    'diploma-1': 'Master recherche',
    'diploma-2': "Diplôme d'ingénieur",
    'centurion-paper': 'Paper Centurion',
    'centurion-scrabble': 'Centurion Scrabble',
    'centurion-poker': 'Centurion Poker',
    'centurion-scheduler': 'Centurion Scheduler',
    'project-portfolio': 'Portfolio web interactif',
    'exp-internship-2': 'Stage de M2',
    'exp-internship-1': 'Stage de M1',
  },
}

/**
 * A short line shown above a node's title, for nodes that are not cards
 * (cards carry theirs as institutionText).
 */
export const nodeSubtitles: Record<Language, Record<string, string>> = {
  en: {
    teaching: 'Computer science bachelor, ISTIC',
  },
  fr: {
    teaching: "Licence d'informatique, ISTIC",
  },
}

/**
 * Where a leaf's magnifying glass leads. Leaves not listed here search the web
 * for their label instead.
 *
 * The courses point at their syllabus on the ISTIC site, in French whatever
 * the site's language, since that is the only version there is.
 */
const istic = 'https://istic.univ-rennes.fr'
const isticSyllabus = `${istic}/sites/istic.univ-rennes.fr/files/medias/files`
const courseSyllabi: Record<string, string> = {
  'teaching-logic': `${isticSyllabus}/UE%20-Logique.pdf`,
  'teaching-algorithms': `${isticSyllabus}/UE%20Algorithmique%202%20-%203%20ECTS.pdf`,
  'teaching-algorithmic-methods': `${isticSyllabus}/UE%20-M%C3%A9thodes%20Algorithmiques.pdf`,
  'teaching-programming': `${isticSyllabus}/UE%20Programmation%202%20-%205%C2%A0ECTS.pdf`,
  'teaching-computability': `${isticSyllabus}/UE%20Calculabilit%C3%A9%20-%204%C2%A0ECTS_0.pdf`,
}

export const nodeLookups: Record<Language, Record<string, string>> = {
  en: courseSyllabi,
  fr: courseSyllabi,
}
