import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Stack } from './Stack';

describe('Stack', () => {
  it('renders its items in a div by default', () => {
    const { container } = render(
      <Stack>
        <p>One</p>
        <p>Two</p>
      </Stack>,
    );

    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(screen.getByText('Two')).toBeInTheDocument();
  });

  it('uses 16px between items by default, and any step of the scale when asked', () => {
    const { container, rerender } = render(<Stack>Items</Stack>);
    expect(container.firstElementChild?.className).toMatch(/gap3/);

    rerender(<Stack gap={6}>Items</Stack>);
    expect(container.firstElementChild?.className).toMatch(/gap6/);
  });

  it('keeps list semantics when rendered as a list', () => {
    render(
      <Stack as="ul">
        <li>One</li>
        <li>Two</li>
      </Stack>,
    );

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('can be another element, such as a section', () => {
    const { container } = render(<Stack as="section">Content</Stack>);

    expect(container.firstElementChild?.tagName).toBe('SECTION');
    expect(container.firstElementChild).not.toHaveAttribute('role');
  });
});
