import type { Page } from '@playwright/test';

export const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu' });
export const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Main' });
export const themeSelect = (page: Page) => page.getByRole('combobox', { name: 'Theme' });
