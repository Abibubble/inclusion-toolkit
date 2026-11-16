/**
 * GitHub Pages adds a trailing slash to pages opened directly, and React Router then fetches the
 * wrong data file (…/_.data). This removes the slash before React Router starts. The home page
 * keeps it, as it's the base path.
 */
export function withoutTrailingSlashScript(basePath: string): string {
  return `(function () {
  var path = location.pathname;
  if (path !== ${JSON.stringify(basePath)} && path.length > 1 && path.charAt(path.length - 1) === '/') {
    history.replaceState(history.state, '', path.replace(/\\/+$/, '') + location.search + location.hash);
  }
})();`;
}
