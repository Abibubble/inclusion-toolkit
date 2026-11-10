import { describe, expect, it } from 'vitest';

import { contrastRatio, relativeLuminance } from './contrast';

describe('contrastRatio', () => {
  it('gives 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('gives 1:1 for identical colours', () => {
    expect(contrastRatio('#5b2a99', '#5b2a99')).toBe(1);
  });

  it('gives the same result whichever colour is the foreground', () => {
    expect(contrastRatio('#5b2a99', '#fbf8ff')).toBe(contrastRatio('#fbf8ff', '#5b2a99'));
  });

  it('matches a known WCAG value', () => {
    // #767676 on white is the well known lightest grey that passes AA at 4.5:1
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('accepts three digit hex colours', () => {
    expect(relativeLuminance('#fff')).toBe(relativeLuminance('#ffffff'));
  });

  it('rejects values that are not hex colours', () => {
    expect(() => relativeLuminance('purple')).toThrow('Not a hex colour: purple');
  });
});
