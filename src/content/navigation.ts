export interface NavItem {
  label: string;
  to: string;
}

/** The page that credits where the toolkit came from, as its licence asks */
export const ABOUT_PATH = '/about';

export const MAIN_NAV: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Accessibility', to: '/accessibility' },
  { label: 'Neurodiversity', to: '/neurodiversity' },
];

/** The page where visitors can change the theme, text size, spacing and font */
export const DISPLAY_SETTINGS_PATH = '/display-settings';

/** The page explaining technical words used on the site, in plain words (WCAG 3.1.3) */
export const GLOSSARY_PATH = '/glossary';

/** The accessibility statement. Not /accessibility, which is the accessibility resources */
export const ACCESSIBILITY_PATH = '/accessibility-statement';

/** The privacy notice */
export const PRIVACY_PATH = '/privacy';

export const FOOTER_NAV: NavItem[] = [
  { label: 'About', to: ABOUT_PATH },
  { label: 'Accessibility statement', to: ACCESSIBILITY_PATH },
  { label: 'Display settings', to: DISPLAY_SETTINGS_PATH },
  { label: 'Glossary', to: GLOSSARY_PATH },
  { label: 'Privacy', to: PRIVACY_PATH },
];
