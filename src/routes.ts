import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('about', 'routes/about.tsx'),
  route('display-settings', 'routes/display-settings.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
