import { type RouteConfig, index, route } from '@react-router/dev/routes';

import { TOOLKIT, toolkitEntries, toolkitPath } from './content/toolkit';

// Every folder and resource in the toolkit has its own page, all from the same route file
const toolkitPages = toolkitEntries(TOOLKIT).map(({ slugs }) =>
  route(toolkitPath(slugs).slice(1), 'routes/toolkit.tsx', { id: `toolkit-${slugs.join('-')}` }),
);

export default [
  index('routes/toolkit.tsx', { id: 'toolkit' }),
  // SEARCH_INDEX_PATH in src/content/toolkitSearch.ts
  route('search.json', 'routes/toolkit-search.ts'),
  ...toolkitPages,
  route('about', 'routes/about.tsx'),
  route('display-settings', 'routes/display-settings.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
