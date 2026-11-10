import { loadToolkitSearchIndex } from '../content/toolkitPage';

/**
 * The words of every toolkit resource's full text, for search. It's made into a file when the site
 * is built, at /search.json, and only fetched once someone starts searching
 */
export function loader() {
  return Response.json(loadToolkitSearchIndex());
}
