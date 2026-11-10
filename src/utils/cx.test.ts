import { describe, expect, it } from 'vitest';

import { cx } from './cx';

describe('cx', () => {
  it('joins class names with spaces', () => {
    expect(cx('one', 'two')).toBe('one two');
  });

  it('skips empty, false, null and undefined values', () => {
    expect(cx('one', '', false, null, undefined, 'two')).toBe('one two');
  });
});
