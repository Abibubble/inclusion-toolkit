import { type ReactNode, useEffect } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

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

export function Layout({ children }: { children: ReactNode }) {
  // Marks that React has taken over the prerendered page, so tests know when it's ready to use
  useEffect(() => {
    document.documentElement.dataset.hydrated = '';
  }, []);

  return (
    <html lang="en-GB">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <script dangerouslySetInnerHTML={{ __html: WITHOUT_TRAILING_SLASH_SCRIPT }} />
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
  return <Outlet />;
}
