import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../test/axe';
import { renderWithRouter } from '../test/render';
import NotFound, { meta } from './not-found';

describe('NotFound', () => {
  it('says the page wasn’t found, with a link back to the home page', () => {
    renderWithRouter(<NotFound />);

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'go to the home page' })).toHaveAttribute('href', '/');
  });

  it('asks search engines not to list it', () => {
    expect(meta()).toContainEqual({ name: 'robots', content: 'noindex' });
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<NotFound />);

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
