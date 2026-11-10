import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import NotFound, { meta } from './not-found';

describe('NotFound', () => {
  it('says the page wasn’t found, with a link back to the home page', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Go to the Inclusion Toolkit home page' }),
    ).toHaveAttribute('href', '/');
  });

  it('asks search engines not to list it', () => {
    expect(meta()).toContainEqual({ name: 'robots', content: 'noindex' });
  });
});
