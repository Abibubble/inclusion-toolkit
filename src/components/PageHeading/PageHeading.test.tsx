import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PAGE_HEADING_ID, PageHeading } from './PageHeading';

describe('PageHeading', () => {
  it('is the top level heading', () => {
    render(<PageHeading>Highlights</PageHeading>);

    expect(screen.getByRole('heading', { level: 1, name: 'Highlights' })).toBeInTheDocument();
  });

  it('can receive focus from script but is not a tab stop', () => {
    render(<PageHeading>Highlights</PageHeading>);
    const heading = screen.getByRole('heading');

    expect(heading).toHaveAttribute('id', PAGE_HEADING_ID);
    expect(heading).toHaveAttribute('tabindex', '-1');
  });
});
