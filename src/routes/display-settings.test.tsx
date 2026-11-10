import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { pageMeta } from '../seo/pageMeta';
import { expectNoAxeViolations } from '../test/axe';
import { renderWithRouter } from '../test/render';
import DisplaySettingsPage, { meta } from './display-settings';

describe('Display settings page', () => {
  it('has the page heading and every setting', () => {
    renderWithRouter(<DisplaySettingsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Display settings' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Text size' })).toBeInTheDocument();
  });

  it('has its own page title and description, at its own address', () => {
    expect(meta()).toEqual(
      pageMeta({
        title: 'Display settings, Inclusion Toolkit',
        description:
          'Change the theme, text size, spacing, font and motion, to make this site easier for you to use.',
        path: '/display-settings',
      }),
    );
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<DisplaySettingsPage />);

    await expectNoAxeViolations(container);
  });
});
