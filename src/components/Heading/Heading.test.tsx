import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type HeadingLevel, Heading, nextLevel } from './Heading';

describe('Heading', () => {
  it.each<HeadingLevel>([2, 3, 4, 5, 6])('renders a level %i heading', (level) => {
    render(<Heading level={level}>Experience</Heading>);

    expect(screen.getByRole('heading', { level, name: 'Experience' })).toBeInTheDocument();
  });

  it('passes an id through, so a section can be named by its heading', () => {
    render(
      <Heading level={2} id="experience">
        Experience
      </Heading>,
    );

    expect(screen.getByRole('heading')).toHaveAttribute('id', 'experience');
  });
});

describe('nextLevel', () => {
  it('gives the level below', () => {
    expect(nextLevel(2)).toBe(3);
  });

  it('never goes past level 6', () => {
    expect(nextLevel(6)).toBe(6);
  });
});
