import { formatDate } from './formatDate';

interface TimeProps {
  date: string;
}

export function Time({ date }: TimeProps) {
  return <time dateTime={date}>{formatDate(date)}</time>;
}
