import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { MAIN_CONTENT_ID, SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('links to the main content', () => {
    render(<SkipLink />);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      `#${MAIN_CONTENT_ID}`,
    );
  });

  it('is left out of printed pages', () => {
    render(<SkipLink />);

    expect(screen.getByRole('link')).toHaveAttribute('data-print', 'hide');
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = render(<SkipLink />);

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
