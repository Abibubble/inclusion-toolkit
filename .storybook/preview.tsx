import '../src/styles/index.css';

import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';

import { WCAG_TAGS } from '../src/test/wcag-tags';
import { ThemedDocsContainer } from './ThemedDocsContainer';
import { applyTheme } from './theme';

document.documentElement.dataset.js = '';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'cream', title: 'Cream' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, { globals }) => {
      applyTheme(globals);
      return Story();
    },
    (Story, { parameters }) => {
      const { path = '/' } = (parameters.router ?? {}) as { path?: string };
      return (
        <MemoryRouter initialEntries={[path]}>
          <Story />
        </MemoryRouter>
      );
    },
  ],
  parameters: {
    docs: {
      container: ThemedDocsContainer,
    },
    a11y: {
      test: 'error',
      options: { runOnly: { type: 'tag', values: WCAG_TAGS } },
      config: { rules: [{ id: 'region', enabled: false }] },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
