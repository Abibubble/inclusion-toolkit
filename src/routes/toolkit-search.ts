import { loadToolkitSearchIndex } from '../content/toolkitPage';

/** Built into /search.json, and only fetched once someone starts searching */
export function loader() {
  return Response.json(loadToolkitSearchIndex());
}
