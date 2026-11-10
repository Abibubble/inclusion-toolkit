import bodyFontUrl from '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2?url';
import { type ReactNode, useEffect } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
} from 'react-router';

import type { Route } from './+types/root';
import { AbbreviationScope } from './components/Abbr';
import { ErrorPage } from './components/ErrorPage';
import { NotFoundPage } from './components/NotFoundPage';
import { SiteShell } from './components/SiteShell';
import { BEFORE_PAINT_SCRIPT } from './settings/beforePaintScript';
import stylesheetUrl from './styles/index.css?url';

const { BASE_URL } = import.meta.env;

/**
 * Each page is a folder with an index.html in it, so GitHub Pages adds a slash to the end of a
 * page's address when someone opens it directly. React Router then looks for that page's data in
 * the wrong file (…/_.data, not ….data), so going back to it failed. This takes the slash off before
 * React Router starts, which also matches the addresses in links and the sitemap
 */
export const WITHOUT_TRAILING_SLASH_SCRIPT = `(function () {
  var path = location.pathname;
  if (path.length > 1 && path.charAt(path.length - 1) === '/') {
    history.replaceState(history.state, '', path.replace(/\\/+$/, '') + location.search + location.hash);
  }
})();`;

export const links: Route.LinksFunction = () => [
  {
    rel: 'preload',
    href: bodyFontUrl,
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
  { rel: 'stylesheet', href: stylesheetUrl },
  // Browsers that support SVG icons use that, others the .ico
  { rel: 'icon', href: `${BASE_URL}favicon.ico`, sizes: '32x32' },
  { rel: 'icon', href: `${BASE_URL}favicon.svg`, type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: `${BASE_URL}apple-touch-icon.png` },
  { rel: 'manifest', href: `${BASE_URL}site.webmanifest` },
];

export function Layout({ children }: { children: ReactNode }) {
  // Marks that React has taken over the prerendered page, so tests know when it's ready to use
  useEffect(() => {
    document.documentElement.dataset.hydrated = '';
  }, []);

  return (
    // The before paint script adds attributes to <html> before React loads, which React would
    // otherwise warn about
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {/* The same as --purple-50 and --purple-950, the light and dark page backgrounds */}
        <meta name="theme-color" content="#f5effa" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#160c24" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: WITHOUT_TRAILING_SLASH_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: BEFORE_PAINT_SCRIPT }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { pathname } = useLocation();

  return (
    <SiteShell>
      <AbbreviationScope key={pathname}>
        <Outlet />
      </AbbreviationScope>
    </SiteShell>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return <SiteShell>{notFound ? <NotFoundPage /> : <ErrorPage />}</SiteShell>;
}
