import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ABBREVIATIONS } from '../../content/abbreviations';
import { renderWithRouter } from '../../test/render';
import { Link } from '../Link';
import { Abbr } from './Abbr';

describe('Abbr', () => {
  it('marks up the abbreviation, with its full form as a description', () => {
    const { container } = render(<Abbr name="WCAG" />);

    expect(container.querySelector('abbr')).toHaveTextContent('WCAG');
    expect(screen.getByRole('button', { name: 'WCAG' })).toHaveAttribute(
      'aria-description',
      'Web Content Accessibility Guidelines',
    );
  });

  it('is a plain abbreviation with a title before JavaScript runs, as when prerendered', () => {
    expect(renderToString(<Abbr name="UK" />)).toBe('<abbr title="United Kingdom">UK</abbr>');
  });

  it('shows the full form when hovered, and hides it when the pointer leaves', async () => {
    const user = userEvent.setup();
    render(<Abbr name="UK" />);

    await user.hover(screen.getByRole('button', { name: 'UK' }));
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();

    await user.unhover(screen.getByRole('button', { name: 'UK' }));
    expect(screen.queryByText('United Kingdom')).not.toBeInTheDocument();
  });

  it('shows the full form when focused or tapped, and hides it with Escape', async () => {
    const user = userEvent.setup();
    render(<Abbr name="UK" />);

    await user.tab();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('United Kingdom')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'UK' }));
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  it('stays a plain abbreviation inside a link, as a button can’t go in a link', () => {
    renderWithRouter(
      <Link to="/files">
        the <Abbr name="PDF" />
      </Link>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('link').querySelector('abbr')).toHaveAttribute(
      'title',
      'Portable Document Format',
    );
  });

  it('writes the full form out in the text when expanded, for its first use on a page', () => {
    const { container } = render(
      <p>
        <Abbr name="WCAG" expand />
      </p>,
    );

    expect(container).toHaveTextContent('Web Content Accessibility Guidelines (WCAG)');
  });

  it('has a real full form for every abbreviation, with no stray spaces', () => {
    for (const [abbreviation, fullForm] of Object.entries(ABBREVIATIONS)) {
      expect(fullForm.trim(), abbreviation).toBe(fullForm);
      expect(fullForm.length, abbreviation).toBeGreaterThan(abbreviation.length);
    }
  });
});
