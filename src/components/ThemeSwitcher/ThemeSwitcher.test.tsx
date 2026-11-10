import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { displaySettingsStore } from '../../settings/displaySettings';
import { expectNoAxeViolations } from '../../test/axe';
import { renderWithRouter } from '../../test/render';
import { DisplaySettings } from '../DisplaySettings';
import { ThemeSwitcher } from './ThemeSwitcher';

const themeSelect = () => screen.getByRole('combobox', { name: 'Theme' });

afterEach(() => {
  displaySettingsStore.reset();
});

describe('ThemeSwitcher', () => {
  it('offers every theme, starting with matching the device', () => {
    renderWithRouter(<ThemeSwitcher />);

    expect(themeSelect()).toHaveValue('system');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Match my device',
      'Light',
      'Dark',
      'Cream',
    ]);
  });

  it('changes the theme as soon as one is chosen', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ThemeSwitcher />);

    await user.selectOptions(themeSelect(), 'Cream');

    expect(themeSelect()).toHaveValue('cream');
    expect(document.documentElement).toHaveAttribute('data-theme', 'cream');
  });

  it('stays in step with the full display settings', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <>
        <ThemeSwitcher />
        <DisplaySettings />
      </>,
    );

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(themeSelect()).toHaveValue('dark');
  });

  it('links to the rest of the display settings, on their own page', () => {
    renderWithRouter(<ThemeSwitcher />);

    expect(screen.getByRole('link', { name: 'More display settings' })).toHaveAttribute(
      'href',
      '/display-settings',
    );
  });

  it('is side by side by default', () => {
    const { container } = renderWithRouter(<ThemeSwitcher />);

    expect(container.firstElementChild?.className).toMatch(/inline/);
  });

  it('can be stacked to fill the width of a menu', () => {
    const { container } = renderWithRouter(<ThemeSwitcher layout="stacked" />);

    expect(container.firstElementChild?.className).toMatch(/stacked/);
  });

  it('is left out of printed pages', () => {
    const { container } = renderWithRouter(<ThemeSwitcher />);

    expect(container.firstElementChild).toHaveAttribute('data-print', 'hide');
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<ThemeSwitcher />);

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
