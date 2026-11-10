import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet, createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { Link } from '../Link';
import { PageHeading } from '../PageHeading';
import { MAIN_CONTENT_ID } from '../SkipLink';
import { SiteShell } from './SiteShell';

function renderSite(path = '/') {
  const Stub = createRoutesStub([
    {
      Component: () => (
        <SiteShell>
          <Outlet />
        </SiteShell>
      ),
      children: [
        {
          path: '/',
          Component: () => (
            <>
              <PageHeading>Home</PageHeading>
              <Link to="/about">About page</Link>
              <Link to="/no-heading">Page without a heading</Link>
              <Link to="/highlights#latest">Latest highlights</Link>
              <Link to="/highlights#settings">Highlight settings</Link>
            </>
          ),
        },
        { path: '/about', Component: () => <PageHeading>About</PageHeading> },
        {
          path: '/highlights',
          Component: () => (
            <>
              <PageHeading>Highlights</PageHeading>
              <h2 id="latest">Latest</h2>
              <h2 id="settings" tabIndex={-1}>
                Settings
              </h2>
            </>
          ),
        },
        { path: '/no-heading', Component: () => <p>A page without a heading</p> },
      ],
    },
  ]);

  return render(<Stub initialEntries={[path]} />);
}

const mainNav = () => screen.getByRole('navigation', { name: 'Main' });

describe('SiteShell', () => {
  it('has a banner, main navigation, main content and footer', () => {
    renderSite();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(mainNav()).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', MAIN_CONTENT_ID);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('makes the skip link the first thing keyboard users reach', async () => {
    const user = userEvent.setup();
    renderSite();

    await user.tab();

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
  });

  it('leaves focus alone when the first page loads', () => {
    renderSite();

    expect(document.body).toHaveFocus();
  });

  it('moves focus to the new page heading after navigating', async () => {
    const user = userEvent.setup();
    renderSite();

    await user.click(screen.getByRole('link', { name: 'About page' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'About' })).toHaveFocus();
  });

  it('moves focus to the main content when a page has no heading', async () => {
    const user = userEvent.setup();
    renderSite();

    await user.click(screen.getByRole('link', { name: 'Page without a heading' }));

    expect(await screen.findByText('A page without a heading')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('moves focus to the section for a link to part of a page, when the section can take focus', async () => {
    const user = userEvent.setup();
    renderSite();

    await user.click(screen.getByRole('link', { name: 'Highlight settings' }));

    expect(await screen.findByRole('heading', { name: 'Settings' })).toHaveFocus();
  });

  it('leaves focus to the browser for links to a section that can’t take focus', async () => {
    const user = userEvent.setup();
    renderSite();

    await user.click(screen.getByRole('link', { name: 'Latest highlights' }));

    expect(await screen.findByRole('heading', { name: 'Highlights' })).not.toHaveFocus();
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderSite();
    await screen.findByRole('heading', { name: 'Home' });

    await expectNoAxeViolations(container);
  });
});
