/**
 * Every abbreviation used on the site, with its expansion. The Abbr component only accepts
 * abbreviations listed here, and the Glossary page's list of abbreviations is built from this list (WCAG 3.1.4)
 */
export const ABBREVIATIONS = {
  ADHD: 'attention deficit hyperactivity disorder',
  AI: 'artificial intelligence',
  ARIA: 'Accessible Rich Internet Applications',
  CBT: 'cognitive behavioural therapy',
  CSS: 'Cascading Style Sheets',
  CT: 'computed tomography',
  GDPR: 'General Data Protection Regulation',
  GP: 'general practitioner',
  HTML: 'HyperText Markup Language',
  MRI: 'magnetic resonance imaging',
  NHS: 'National Health Service',
  OCD: 'obsessive-compulsive disorder',
  PDF: 'Portable Document Format',
  QR: 'Quick Response',
  SEO: 'search engine optimisation',
  UK: 'United Kingdom',
  URL: 'uniform resource locator',
  W3C: 'World Wide Web Consortium',
  WCAG: 'Web Content Accessibility Guidelines',
} as const;

export type Abbreviation = keyof typeof ABBREVIATIONS;

/**
 * Abbreviations most people know, which are never written out in the text, as that would make it
 * harder to read. They're still marked up with their full form, and listed on the Glossary page
 */
export const ALWAYS_SHORT: readonly Abbreviation[] = [
  'ADHD',
  'AI',
  'CBT',
  'CSS',
  'CT',
  'GP',
  'HTML',
  'MRI',
  'NHS',
  'OCD',
  'PDF',
  'QR',
  'UK',
];
