import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

import { BASE_PATH, BUILD_DEFINES } from './build-constants.ts';

export default defineConfig({
  base: BASE_PATH,
  define: BUILD_DEFINES,
  build: { cssCodeSplit: false },
  // Prerendering uses this server. Some machines, such as CI, resolve localhost to IPv6 for one
  // side and IPv4 for the other
  preview: { host: '127.0.0.1' },
  plugins: [reactRouter()],
});
