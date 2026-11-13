import bodyFontUrl from '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2?url';
import { type ReactNode, useEffect } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  NavigationType,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
  useNavigationType,
} from 'react-router';

import type { Route } from './+types/root';
import { withoutTrailingSlashScript } from './build/trailingSlash';
import { AbbreviationScope } from './components/Abbr';
import { ErrorPage } from './components/ErrorPage';
import { NotFoundPage } from './components/NotFoundPage';
import { PAGE_HEADING_ID } from './components/PageHeading';
import { SiteShell } from './components/SiteShell';
import { pageTitle } from './content/site';
import { BEFORE_PAINT_SCRIPT } from './settings/beforePaintScript';
import stylesheetUrl from './styles/index.css?url';

const { BASE_URL } = import.meta.env;

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
        {/* The same as --blue-50 and --blue-950, the light and dark page backgrounds */}
        <meta name="theme-color" content="#eff5fb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0b1422" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: withoutTrailingSlashScript(BASE_URL) }} />
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

// Pages set their own titles, so this is only for the error page, which replaces them (WCAG 2.4.2)
export function meta({ error }: Route.MetaArgs): Route.MetaDescriptors {
  if (!error) return [];
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return [
    { title: pageTitle(notFound ? 'Page not found' : 'Sorry, there’s a problem with this page') },
  ];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const navigationType = useNavigationType();

  // The error page brings its own shell, so the shell's focus handling starts again and doesn't
  // move focus. After a link or button, focus goes to the heading, so screen reader users hear that
  // the page changed (WCAG 2.4.3). Not on Back or Forward, or when the page first loads
  useEffect(() => {
    if (navigationType !== NavigationType.Pop) document.getElementById(PAGE_HEADING_ID)?.focus();
  }, [navigationType]);

  return <SiteShell>{notFound ? <NotFoundPage /> : <ErrorPage />}</SiteShell>;
}
