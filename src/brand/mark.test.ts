// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MARK, markSvg } from './mark';

describe('markSvg', () => {
  it('draws the mark with rounded corners', () => {
    const svg = markSvg();

    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/);
    expect(svg).toContain('<rect width="64" height="64" rx="14" fill="#1C4882"/>');
    expect(svg.match(/<rect /g)).toHaveLength(MARK.shapes.length + 1);
  });

  it('can have square corners, for Apple’s home screen icons', () => {
    expect(markSvg({ rounded: false })).toContain('<rect width="64" height="64" fill="#1C4882"/>');
  });

  it('keeps every shape inside the square', () => {
    for (const { x, y, width, height } of MARK.shapes) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + width).toBeLessThanOrEqual(64);
      expect(y + height).toBeLessThanOrEqual(64);
    }
  });

  it('matches the favicon, so the icons are redrawn whenever the mark changes', () => {
    const favicon = readFileSync(join(import.meta.dirname, '../../public/favicon.svg'), 'utf8');

    expect(favicon.trim()).toBe(markSvg());
  });
});
