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

export const FOOTER_NAV: NavItem[] = [
  { label: 'About', to: ABOUT_PATH },
  { label: 'Display settings', to: DISPLAY_SETTINGS_PATH },
];
