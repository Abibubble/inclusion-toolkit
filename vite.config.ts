import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

import { BASE_PATH, BUILD_DEFINES } from './build-constants.ts';

export default defineConfig({
  base: BASE_PATH,
  define: BUILD_DEFINES,
  build: { cssCodeSplit: false },
  // The build starts a preview server to prerender the pages. On some computers, such as CI's
  // Playwright container, "localhost" means the IPv6 address to the server but the IPv4 one to the
  // build, so the build can't reach it. Using the IPv4 address directly works everywhere
  preview: { host: '127.0.0.1' },
  plugins: [reactRouter()],
});
