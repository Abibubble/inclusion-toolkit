import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { Card } from './Card';

describe('Card', () => {
  it('renders its content in a div by default', () => {
    const { container } = render(<Card>Content</Card>);

    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('can be an article, for a self contained item', () => {
    render(
      <Card as="article">
        <h2>Dark mode</h2>
      </Card>,
    );

    expect(screen.getByRole('article')).toContainElement(screen.getByRole('heading'));
  });

  it('is never split across two printed pages', () => {
    const { container } = render(<Card>Content</Card>);

    expect(container.firstElementChild).toHaveAttribute('data-print', 'keep-together');
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = render(
      <Card as="article">
        <h2>Dark mode</h2>
        <p>Why dark mode helps some people.</p>
      </Card>,
    );

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
