import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { formatDate } from './formatDate';
import { DateRange, Time } from './Time';

describe('formatDate', () => {
  it.each([
    ['2026', '2026'],
    ['2026-06', 'June 2026'],
    ['2025-04-03', '3 April 2025'],
    ['2021-08', 'August 2021'],
  ])('writes %s as "%s"', (date, expected) => {
    expect(formatDate(date)).toBe(expected);
  });

  it('gives the same result in any time zone, because it uses UTC', () => {
    expect(formatDate('2026-01-01')).toBe('1 January 2026');
  });

  it.each(['3/4/25', '2026-6', 'June 2026', ''])('rejects "%s"', (date) => {
    expect(() => formatDate(date)).toThrow('Not a date in the form YYYY, YYYY-MM or YYYY-MM-DD');
  });

  it.each(['2026-13', '2026-00', '2026-02-30', '2026-04-31'])(
    'rejects %s, which looks like a date but does not exist',
    (date) => {
      expect(() => formatDate(date)).toThrow(`Not a real date: ${date}`);
    },
  );
});

describe('Time', () => {
  it('shows the date in words, with the machine readable form', () => {
    const { container } = render(<Time date="2026-06" />);
    const time = container.querySelector('time');

    expect(time).toHaveTextContent('June 2026');
    expect(time).toHaveAttribute('datetime', '2026-06');
  });
});

describe('DateRange', () => {
  it('joins two dates with "to"', () => {
    const { container } = render(<DateRange from="2019-06" to="2021-07" />);

    expect(container).toHaveTextContent('June 2019 to July 2021');
    expect(container.querySelectorAll('time')).toHaveLength(2);
  });

  it('ends with "present" for something still going on', () => {
    const { container } = render(<DateRange from="2021-08" />);

    expect(container).toHaveTextContent('August 2021 to present');
  });
});
