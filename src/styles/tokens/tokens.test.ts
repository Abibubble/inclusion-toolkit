// @vitest-environment node
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { contrastRatio } from '../../test/contrast';

const readTokens = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

const primitives = new Map(
  [...readTokens('./primitives.css').matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6});/gi)].map(
    ([, name, hex]) => [name, hex] as [string, string],
  ),
);

const colourBlocks = new Map(
  [
    ...readTokens('./colours.css')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(/([^{}]+)\{([^{}]*)\}/g),
  ].map(([, selector = '', body = '']) => [selector.trim(), body]),
);
const rootBlock = colourBlocks.get(':root') ?? '';
const creamBlock = colourBlocks.get(":root[data-theme='cream']") ?? '';

// Light and dark are written as light-dark(var(--light), var(--dark))
const lightDark = [
  ...rootBlock.matchAll(
    /--(color-[\w-]+):\s*light-dark\(\s*var\(--([\w-]+)\),\s*var\(--([\w-]+)\)\s*\)/g,
  ),
];

// Cream sets each token directly, as var(--primitive)
const cream = [...creamBlock.matchAll(/--(color-[\w-]+):\s*var\(--([\w-]+)\);/g)];

const THEMES = ['light', 'dark', 'cream'] as const;
type Theme = (typeof THEMES)[number];

const themes: Record<Theme, Map<string, string>> = {
  light: new Map(lightDark.map(([, name = '', light = '']) => [name, light])),
  dark: new Map(lightDark.map(([, name = '', , dark = '']) => [name, dark])),
  cream: new Map(cream.map(([, name = '', primitive = '']) => [name, primitive])),
};

function resolve(token: string, theme: Theme): string {
  const primitive = themes[theme].get(token);
  const hex = primitive === undefined ? undefined : primitives.get(primitive);

  if (hex === undefined) {
    throw new Error(`Couldn't resolve --${token} in the ${theme} theme`);
  }

  return hex;
}

const AAA_TEXT = 7;

const PAIRINGS: [foreground: string, background: string][] = [
  ['color-text', 'color-bg'],
  ['color-text', 'color-surface'],
  ['color-text-muted', 'color-bg'],
  ['color-text-muted', 'color-surface'],
  ['color-action', 'color-bg'],
  ['color-action', 'color-surface'],
  ['color-action-hover', 'color-bg'],
  ['color-action-hover', 'color-surface'],
  ['color-action-text', 'color-action'],
  ['color-action-text', 'color-action-hover'],
  ['color-focus', 'color-bg'],
  ['color-focus', 'color-surface'],
  ['color-error', 'color-bg'],
  ['color-error', 'color-surface'],
  ['color-success', 'color-bg'],
  ['color-success', 'color-surface'],
  ['color-border', 'color-bg'],
  ['color-border', 'color-surface'],
  ['color-selection-text', 'color-selection-bg'],
];

describe('colour tokens', () => {
  it('writes every light and dark colour in a form this test can read', () => {
    const declared = rootBlock.match(/--color-[\w-]+:/g) ?? [];

    expect(themes.light.size).toBeGreaterThan(0);
    expect(themes.light.size).toBe(declared.length);
  });

  it('sets every semantic colour in the Cream theme', () => {
    expect([...themes.cream.keys()].sort()).toEqual([...themes.light.keys()].sort());
  });

  it.each(THEMES)('resolves every semantic colour to a primitive in the %s theme', (theme) => {
    for (const token of themes.light.keys()) {
      expect(() => resolve(token, theme)).not.toThrow();
    }
  });

  describe.each(THEMES)('%s theme', (theme) => {
    it.each(PAIRINGS)('%s on %s meets the 7:1 AAA contrast ratio', (foreground, background) => {
      const ratio = contrastRatio(resolve(foreground, theme), resolve(background, theme));

      expect(ratio).toBeGreaterThanOrEqual(AAA_TEXT);
    });
  });
});

const ALLOWED_PIXEL_SIZES = [4, 8, 16, 24, 32, 48, 96];
const ROOT_FONT_SIZE = 16;

const AGREED_EXCEPTIONS = new Map([
  ['space-paragraph', 40],
  ['border-width', 2],
]);

function remTokens(file: string, prefix = ''): Map<string, number> {
  return new Map(
    [...readTokens(file).matchAll(new RegExp(`--(${prefix}[\\w-]*):\\s*([\\d.]+)rem;`, 'g'))].map(
      ([, name, rem]) => [name, Number(rem) * ROOT_FONT_SIZE] as [string, number],
    ),
  );
}

describe('size tokens', () => {
  it('defines the 4, 8, 16, 24, 32, 48, 96 pixel spacing scale', () => {
    const scale = [...remTokens('./spacing.css', 'spacer-').values()];

    expect(scale).toEqual(ALLOWED_PIXEL_SIZES);
  });

  it('only uses sizes from the scale, apart from the agreed exceptions', () => {
    for (const [name, pixels] of remTokens('./spacing.css')) {
      const allowed = AGREED_EXCEPTIONS.has(name)
        ? [AGREED_EXCEPTIONS.get(name)]
        : ALLOWED_PIXEL_SIZES;

      expect(allowed, `--${name} is ${pixels}px`).toContain(pixels);
    }
  });

  it('only uses sizes from the scale for font sizes', () => {
    const fontSizes = remTokens('./typography.css', 'font-size-');

    expect(fontSizes.size).toBeGreaterThan(0);
    for (const [name, pixels] of fontSizes) {
      expect(ALLOWED_PIXEL_SIZES, `--${name} is ${pixels}px`).toContain(pixels);
    }
  });
});
