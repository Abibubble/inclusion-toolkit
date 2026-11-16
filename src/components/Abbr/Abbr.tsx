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
 * An abbreviation, the same as abbreviations in the toolkit text. Its full form is written out the
 * first time it's used on a page, and in the list on the Glossary page, which everyone can use, with
 * a mouse, keyboard, touch, or screen reader (WCAG 3.1.4). It has no title: screen readers read a
 * title as well as the words, and its tooltip only shows for a mouse
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
