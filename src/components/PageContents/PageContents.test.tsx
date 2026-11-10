import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { PageContents } from './PageContents';
import { PageContentsSection } from './PageContentsSection';

const SECTIONS: [{ id: string; title: string }, ...{ id: string; title: string }[]] = [
  { id: 'first', title: 'First section' },
  { id: 'second', title: 'Second section' },
];

describe('PageContents', () => {
  it('is a navigation landmark named by its heading', () => {
    render(<PageContents sections={SECTIONS} />);

    const nav = screen.getByRole('navigation', { name: 'On this page' });
    expect(within(nav).getByRole('heading', { level: 2 })).toHaveTextContent('On this page');
  });

  it('links to each section by its heading’s id, in order', () => {
    render(<PageContents sections={SECTIONS} />);

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['First section', 'Second section']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#first', '#second']);
  });

  it('shows long lists in columns on wide screens, and short ones as a single list', () => {
    const many = Array.from({ length: 9 }, (_, index) => ({
      id: `section-${String(index)}`,
      title: `Section ${String(index)}`,
    }));
    const { unmount } = render(<PageContents sections={many} />);
    const columns = screen.getByRole('list').className;
    unmount();
    render(<PageContents sections={SECTIONS} />);

    expect(columns).not.toBe(screen.getByRole('list').className);
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = render(<PageContents sections={SECTIONS} />);

    await expectNoAxeViolations(container);
  });
});

describe('PageContentsSection', () => {
  it('is a region named by its heading, which links from the contents can focus', () => {
    render(
      <PageContentsSection section={SECTIONS[0]}>
        <p>Content</p>
      </PageContentsSection>,
    );

    const heading = screen.getByRole('heading', { level: 2, name: 'First section' });
    expect(heading).toHaveAttribute('id', 'first');
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('region', { name: 'First section' })).toHaveTextContent('Content');
  });
});
