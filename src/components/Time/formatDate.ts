const DATE_PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

// UTC, so prerendered HTML and the browser always agree, whatever the visitor's time zone
const FORMATS = {
  year: new Intl.DateTimeFormat('en-GB', { year: 'numeric', timeZone: 'UTC' }),
  month: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  day: new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }),
};

/**
 * Formats a date written as "2026", "2026-06" or "2026-06-03" in words, as "2026", "June 2026" or
 * "3 June 2026". Months are always written out, because a date like 3/6/26 means different things to
 * different people and is harder to read for people with dyscalculia
 */
export function formatDate(date: string): string {
  const match = DATE_PATTERN.exec(date);

  if (!match) {
    throw new Error(`Not a date in the form YYYY, YYYY-MM or YYYY-MM-DD: ${date}`);
  }

  const [, year, month, day] = match;
  const monthIndex = Number(month ?? 1) - 1;
  const value = new Date(Date.UTC(Number(year), monthIndex, Number(day ?? 1)));

  // Dates such as 2026-02-30 would otherwise roll over into the next month without complaint
  if (value.getUTCMonth() !== monthIndex || value.getUTCDate() !== Number(day ?? 1)) {
    throw new Error(`Not a real date: ${date}`);
  }

  if (day !== undefined) return FORMATS.day.format(value);
  if (month !== undefined) return FORMATS.month.format(value);
  return FORMATS.year.format(value);
}
