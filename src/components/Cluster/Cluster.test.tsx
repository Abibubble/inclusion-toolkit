import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Cluster } from './Cluster';

describe('Cluster', () => {
  it('uses 8px between items, centred, by default', () => {
    const { container } = render(<Cluster>Items</Cluster>);
    const className = container.firstElementChild?.className;

    expect(className).toMatch(/gap2/);
    expect(className).toMatch(/align-center/);
    expect(className).toMatch(/justify-start/);
  });

  it('accepts a gap, alignment and justification', () => {
    const { container } = render(
      <Cluster gap={4} align="baseline" justify="spaceBetween">
        Items
      </Cluster>,
    );
    const className = container.firstElementChild?.className;

    expect(className).toMatch(/gap4/);
    expect(className).toMatch(/align-baseline/);
    expect(className).toMatch(/justify-spaceBetween/);
  });

  it('keeps list semantics when rendered as a list', () => {
    render(
      <Cluster as="ul">
        <li>One</li>
        <li>Two</li>
      </Cluster>,
    );

    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('can name a list for screen reader users', () => {
    render(
      <Cluster as="ul" aria-label="Technologies used">
        <li>React</li>
      </Cluster>,
    );

    expect(screen.getByRole('list', { name: 'Technologies used' })).toBeInTheDocument();
  });

  it('passes a class name through', () => {
    const { container } = render(<Cluster className="custom">Items</Cluster>);

    expect(container.firstElementChild).toHaveClass('custom');
  });
});
