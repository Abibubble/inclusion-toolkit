export interface NavItem {
  label: string;
  to: string;
}

/** The page that credits where the toolkit came from, as its licence asks */
export const ABOUT_PATH = '/about';

export const MAIN_NAV: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Highlights', to: '/highlights' },
  { label: 'Infographics', to: '/infographics' },
  { label: 'About', to: ABOUT_PATH },
];

/** The page where visitors can change the theme, text size, spacing, font and motion */
export const DISPLAY_SETTINGS_PATH = '/display-settings';

/** The page explaining technical words used on the site, in plain words (WCAG 3.1.3) */
export const GLOSSARY_PATH = '/glossary';

/** The accessibility statement */
export const ACCESSIBILITY_PATH = '/accessibility';

/** The privacy notice */
export const PRIVACY_PATH = '/privacy';

export const FOOTER_NAV: NavItem[] = [
  { label: 'About', to: ABOUT_PATH },
  { label: 'Accessibility', to: ACCESSIBILITY_PATH },
  { label: 'Display settings', to: DISPLAY_SETTINGS_PATH },
  { label: 'Glossary', to: GLOSSARY_PATH },
  { label: 'Privacy', to: PRIVACY_PATH },
];
