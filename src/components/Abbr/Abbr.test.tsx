import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ABBREVIATIONS } from '../../content/abbreviations';
import { renderWithRouter } from '../../test/render';
import { Link } from '../Link';
import { Abbr } from './Abbr';

describe('Abbr', () => {
  it('marks up the abbreviation, with its full form as a title', () => {
    const { container } = render(<Abbr name="WCAG" />);

    expect(container.querySelector('abbr')).toHaveTextContent('WCAG');
    expect(container.querySelector('abbr')).toHaveAttribute(
      'title',
      'Web Content Accessibility Guidelines',
    );
  });

  it('is plain text, not something to tab to, the same when prerendered', () => {
    render(<Abbr name="UK" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(renderToString(<Abbr name="UK" />)).toBe('<abbr title="United Kingdom">UK</abbr>');
  });

  it('works inside a link', () => {
    renderWithRouter(
      <Link to="/files">
        the <Abbr name="PDF" />
      </Link>,
    );

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
