import { formatDate } from './formatDate';

interface TimeProps {
  date: string;
}

export function Time({ date }: TimeProps) {
  return <time dateTime={date}>{formatDate(date)}</time>;
}

interface DateRangeProps {
  from: string;
  to?: string | undefined;
}

/** Uses "to" instead of a dash to make the date range easier to read */
export function DateRange({ from, to }: DateRangeProps) {
  return (
    <span>
      <Time date={from} /> to {to === undefined ? 'present' : <Time date={to} />}
    </span>
  );
}
