/**
 * Each page is a folder with an index.html in it, so GitHub Pages adds a slash to the end of a
 * page's address when someone opens it directly. React Router then looks for that page's data in
 * the wrong file (…/_.data, not ….data), so going back to it failed. This script takes the slash off
 * before React Router starts, which also matches the addresses in links and the sitemap.
 *
 * The home page keeps its slash, as it's the site's base path. Under a base path such as
 * /inclusion-toolkit/, taking it off would leave an address React Router doesn't recognise
 */
export function withoutTrailingSlashScript(basePath: string): string {
  return `(function () {
  var path = location.pathname;
  if (path !== ${JSON.stringify(basePath)} && path.length > 1 && path.charAt(path.length - 1) === '/') {
    history.replaceState(history.state, '', path.replace(/\\/+$/, '') + location.search + location.hash);
  }
})();`;
}
