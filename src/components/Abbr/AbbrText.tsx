import { Fragment, type ReactNode } from 'react';

import {
  ABBREVIATION_PATTERN,
  ABBREVIATIONS,
  type Abbreviation,
} from '../../content/abbreviations';
import { Abbr } from './Abbr';

function spelledOutBefore(before: string, name: Abbreviation, plural: boolean): boolean {
  const fullForm = `${ABBREVIATIONS[name]}${plural ? 's' : ''} (`.toLowerCase();
  return before.toLowerCase().endsWith(fullForm);
}

export function AbbrText({ children }: { children: string }) {
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of children.matchAll(ABBREVIATION_PATTERN)) {
    const name = match[1] as Abbreviation;
    const plural = match[2] === 's';
    parts.push(children.slice(last, match.index));
    parts.push(
      <Abbr
        name={name}
        plural={plural}
        spelledOut={spelledOutBefore(children.slice(0, match.index), name, plural)}
      />,
    );
    last = match.index + match[0].length;
  }
  parts.push(children.slice(last));

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>{part}</Fragment>
      ))}
    </>
  );
}
