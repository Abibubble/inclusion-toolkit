import { useId } from 'react';

import { ABBREVIATIONS, ALWAYS_SHORT, type Abbreviation } from '../../content/abbreviations';
import { AbbrTooltip } from './AbbrTooltip';
import { useFirstUses } from './AbbreviationScope';

interface AbbrProps {
  name: Abbreviation;
  expand?: boolean;
  spelledOut?: boolean;
  plural?: boolean;
}

export function Abbr({ name, expand, spelledOut = false, plural = false }: AbbrProps) {
  const id = useId();
  const firstUses = useFirstUses();
  const auto = ALWAYS_SHORT.includes(name) ? false : undefined;
  const isFirst = (expand ?? auto) !== false && (firstUses?.isFirst(name, id) ?? false);
  const ending = plural ? 's' : '';
  const fullForm = ABBREVIATIONS[name];
  const abbr = (
    <AbbrTooltip fullForm={fullForm}>
      {name}
      {ending}
    </AbbrTooltip>
  );

  if (!(expand ?? (isFirst && !spelledOut))) return abbr;

  return (
    <>
      {fullForm}
      {ending} ({abbr})
    </>
  );
}
