import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { renderWithRouter } from '../../test/render';
import { Link } from './Link';

describe('Link', () => {
  describe('to a page on this site', () => {
    it('links to the page', () => {
      renderWithRouter(<Link to="/highlights">Highlights</Link>);

      expect(screen.getByRole('link', { name: 'Highlights' })).toHaveAttribute(
        'href',
        '/highlights',
      );
    });

    it('has no detectable accessibility issues', async () => {
      const { container } = renderWithRouter(<Link to="/highlights">Highlights</Link>);

      await expectNoAxeViolations(container, { disableRules: ['region'] });
    });
  });

  describe('to another site', () => {
    it('tells everyone it goes to another site, not just people who can see the icon', () => {
      renderWithRouter(
        <Link href="https://www.w3.org/WAI/">W3C Web Accessibility Initiative</Link>,
      );

      expect(
        screen.getByRole('link', { name: 'W3C Web Accessibility Initiative (external site)' }),
      ).toHaveAttribute('href', 'https://www.w3.org/WAI/');
    });

    it('opens in the same tab, so nothing changes without warning (WCAG 3.2.5)', () => {
      renderWithRouter(
        <Link href="https://www.w3.org/WAI/">W3C Web Accessibility Initiative</Link>,
      );

      expect(screen.getByRole('link')).not.toHaveAttribute('target');
    });

    it('hides the icon from assistive technology, because the text already says it', () => {
      const { container } = renderWithRouter(<Link href="https://example.com">Example</Link>);

      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('prints its web address after it, unless it already shows the address', () => {
      renderWithRouter(
        <>
          <Link href="https://www.w3.org/WAI/">W3C Web Accessibility Initiative</Link>
          <Link href="https://example.com" showsAddress>
            example.com
          </Link>
        </>,
      );

      expect(
        screen.getByRole('link', { name: /Web Accessibility Initiative/ }),
      ).not.toHaveAttribute('data-print-url');
      expect(screen.getByRole('link', { name: /example\.com/ })).toHaveAttribute(
        'data-print-url',
        'hide',
      );
    });

    it('has no detectable accessibility issues', async () => {
      const { container } = renderWithRouter(<Link href="https://example.com">Example</Link>);

      await expectNoAxeViolations(container, { disableRules: ['region'] });
    });
  });

  it('passes a class name through for styling', () => {
    renderWithRouter(
      <Link to="/" className="custom">
        Home
      </Link>,
    );

    expect(screen.getByRole('link')).toHaveClass('custom');
  });
});
