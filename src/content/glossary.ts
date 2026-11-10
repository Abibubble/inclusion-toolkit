export interface GlossaryTerm {
  term: string;
  definition: string;
}

/**
 * Technical words used on the site, explained in plain words, for the Glossary page (WCAG 3.1.3).
 * Abbreviations have their own list. In alphabetical order, and written without abbreviations, so
 * nothing in a definition needs explaining itself
 */
export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'A11y',
    definition:
      'A short way of writing accessibility. The 11 stands for the 11 letters between the a and the y.',
  },
  {
    term: 'Captions',
    definition: 'Text on a video showing everything that’s said, and other important sounds.',
  },
  {
    term: 'Neurodiversity',
    definition:
      'The natural differences in how people’s brains work. Neurodivergent people include autistic people, and people with dyslexia or dyspraxia.',
  },
  {
    term: 'Photosensitivity',
    definition: 'When flashing or flickering light can cause discomfort or seizures.',
  },
  {
    term: 'Screen reader',
    definition:
      'Software that reads out what’s on the screen, used by many blind and partially sighted people.',
  },
];
