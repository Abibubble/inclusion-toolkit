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
 * An abbreviation, marked up with its full form as a title, the same as abbreviations in the
 * toolkit text (WCAG 3.1.4). The browser shows the title as its own tooltip. Everyone also gets the
 * full form written out the first time it's used on a page, and in the list on the Glossary page,
 * which works with a keyboard and screen readers too
 */
export function Abbr({ name, expand, spelledOut = false, plural = false }: AbbrProps) {
  const id = useId();
  const firstUses = useFirstUses();
  const auto = ALWAYS_SHORT.includes(name) ? false : undefined;
  const isFirst = (expand ?? auto) !== false && (firstUses?.isFirst(name, id) ?? false);
  const ending = plural ? 's' : '';
  const fullForm = ABBREVIATIONS[name];
  const abbr = (
    <abbr title={fullForm}>
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
