import { describe, expect, it } from 'vitest';

import { type SpaceStep, gapClass } from './gap';

describe('gapClass', () => {
  it.each<SpaceStep>([1, 2, 3, 4, 5, 6, 7])('has a class for step %i of the scale', (step) => {
    expect(gapClass(step)).toMatch(new RegExp(`gap${step}`));
  });
});
