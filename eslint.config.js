import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'build',
    'coverage',
    'storybook-static',
    'playwright-report',
    'test-results',
    '.react-router',
    '.pages-preview',
    '.lighthouseci',
    'lighthouse-report',
  ]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: 'detect' } },
  },
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.strict,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'react/prop-types': 'off',
      'jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
      'react/forbid-dom-props': [
        'error',
        {
          forbid: [
            {
              propName: 'style',
              message:
                'The Content Security Policy blocks inline styles in prerendered HTML. Use a CSS Module.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  prettier,
]);
