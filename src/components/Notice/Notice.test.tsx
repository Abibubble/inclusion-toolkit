import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { Notice } from './Notice';

describe('Notice', () => {
  it('is announced when it appears, named by its heading', () => {
    render(
      <Notice variant="success" title="Message sent">
        <p>I’ll reply within a week.</p>
      </Notice>,
    );

    expect(screen.getByRole('alert', { name: 'Message sent' })).toHaveTextContent(
      'I’ll reply within a week.',
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Message sent' })).toBeInTheDocument();
  });

  it('can be focused by the parent, without becoming a tab stop', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Notice ref={ref} variant="error" title="Your message wasn’t sent" />);

    ref.current?.focus();

    expect(ref.current).toHaveFocus();
    expect(ref.current).toHaveAttribute('tabindex', '-1');
  });

  it.each(['success', 'error'] as const)(
    'has no detectable accessibility issues as a %s notice',
    async (variant) => {
      const { container } = render(
        <Notice variant={variant} title="Title">
          <p>Details</p>
        </Notice>,
      );

      await expectNoAxeViolations(container, { disableRules: ['region'] });
    },
  );
});
