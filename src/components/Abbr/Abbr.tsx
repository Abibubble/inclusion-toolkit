import { useId } from 'react';

import { ABBREVIATIONS, ALWAYS_SHORT, type Abbreviation } from '../../content/abbreviations';
import { useFirstUses } from './AbbreviationScope';

interface AbbrProps {
  name: Abbreviation;
  expand?: boolean;
  spelledOut?: boolean;
  plural?: boolean;
}

/**
 * Written out in full on its first use on a page (WCAG 3.1.4). No title attribute: screen readers
 * read it twice, and the tooltip only shows for a mouse
 */
export function Abbr({ name, expand, spelledOut = false, plural = false }: AbbrProps) {
  const id = useId();
  const firstUses = useFirstUses();
  const auto = ALWAYS_SHORT.includes(name) ? false : undefined;
  const isFirst = (expand ?? auto) !== false && (firstUses?.isFirst(name, id) ?? false);
  const ending = plural ? 's' : '';
  const fullForm = ABBREVIATIONS[name];
  const abbr = (
    <abbr>
      {name}
      {ending}
    </abbr>
  );

  if (!(expand ?? (isFirst && !spelledOut))) return abbr;

  return (
    <>
      {fullForm}
      {ending} ({abbr})
    </>
  );
}
