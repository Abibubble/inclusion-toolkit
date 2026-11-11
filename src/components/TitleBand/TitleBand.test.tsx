import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { TitleBand } from './TitleBand';

describe('TitleBand', () => {
  it('shows its content', () => {
    render(
      <TitleBand>
        <h1>Buttons</h1>
      </TitleBand>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Buttons' })).toBeInTheDocument();
  });

  it('adds no landmark or other meaning of its own', () => {
    const { container } = render(<TitleBand>Content</TitleBand>);

    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(container.firstElementChild).not.toHaveAttribute('role');
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = render(
      <TitleBand>
        <h1>Buttons</h1>
        <p>Buttons let people take an action.</p>
      </TitleBand>,
    );

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
