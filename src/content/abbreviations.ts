/**
 * Every abbreviation used on the site, with its expansion. The Abbr component only accepts
 * abbreviations listed here, and the Glossary page's list of abbreviations is built from this list (WCAG 3.1.4)
 */
export const ABBREVIATIONS = {
  ADHD: 'attention deficit hyperactivity disorder',
  AI: 'artificial intelligence',
  AMOLED: 'active-matrix organic light-emitting diode',
  AQR: 'Accessible QR',
  ARIA: 'Accessible Rich Internet Applications',
  ASCII: 'American Standard Code for Information Interchange',
  AT: 'assistive technology',
  CBT: 'cognitive behavioural therapy',
  Cmd: 'Command',
  CSS: 'Cascading Style Sheets',
  CT: 'computed tomography',
  Ctrl: 'Control',
  GP: 'general practitioner',
  HMRC: 'His Majesty’s Revenue and Customs',
  HTML: 'HyperText Markup Language',
  IQ: 'intelligence quotient',
  LESS: 'Leaner Style Sheets',
  MDN: 'Mozilla Developer Network',
  MRI: 'magnetic resonance imaging',
  MS: 'multiple sclerosis',
  NFC: 'near-field communication',
  NHS: 'National Health Service',
  NZ: 'New Zealand',
  OCD: 'obsessive-compulsive disorder',
  OLED: 'organic light-emitting diode',
  PAC: 'PDF Accessibility Checker',
  PDF: 'Portable Document Format',
  pt: 'points, a unit of font size',
  px: 'pixels',
  QR: 'Quick Response',
  RNIB: 'Royal National Institute of Blind People',
  SASS: 'Syntactically Awesome Style Sheets',
  SC: 'success criterion',
  SEO: 'search engine optimisation',
  TV: 'television',
  UK: 'United Kingdom',
  URL: 'uniform resource locator',
  W3C: 'World Wide Web Consortium',
  WAI: 'Web Accessibility Initiative',
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
  'ASCII',
  'CBT',
  'CSS',
  'CT',
  'GP',
  'HTML',
  'MRI',
  'NHS',
  'OCD',
  'PDF',
  'pt',
  'px',
  'QR',
  'TV',
  'UK',
];
