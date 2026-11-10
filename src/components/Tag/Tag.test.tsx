import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { Tag, TagList } from './Tag';

describe('Tag', () => {
  it('shows its label as plain text, not a link or button', () => {
    render(<Tag>React</Tag>);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('TagList', () => {
  const tags = ['React', 'TypeScript', 'Storybook'];

  it('is a named list, so screen readers say what it is and how many tags there are', () => {
    render(<TagList tags={tags} label="Technologies used" />);

    expect(screen.getByRole('list', { name: 'Technologies used' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = render(<TagList tags={tags} label="Technologies used" />);

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
