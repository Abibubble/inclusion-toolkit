import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { renderWithRouter } from '../../test/render';
import { ErrorPage } from './ErrorPage';

describe('ErrorPage', () => {
  it('says what happened and offers a way forward', () => {
    renderWithRouter(<ErrorPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sorry, there’s a problem with this page' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<ErrorPage />);

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
