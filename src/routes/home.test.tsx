import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Home, { meta } from './home';

describe('Home', () => {
  it('has the site name as its only main heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Inclusion Toolkit' })).toBeVisible();
  });

  it('uses the site name as its title', () => {
    expect(meta()).toEqual([{ title: 'Inclusion Toolkit' }]);
  });
});
