import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { PAGE_HEADING_ID } from '../components/PageHeading';
import { MAIN_CONTENT_ID } from '../components/SkipLink';

/** Elements that can take focus without a tabindex */
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';

/**
 * Moves focus to the element with an id, so the next Tab carries on from it rather than from the
 * top of the page (WCAG 2.4.3). A closed <details> can't take focus, but its <summary> can.
 * Anything else that can't, such as a glossary table's <th>, is made focusable from code
 */
export function focusById(id: string): void {
  const target = document.getElementById(id);
  const focusTarget =
    target instanceof HTMLDetailsElement ? target.querySelector('summary') : target;
  if (focusTarget && !focusTarget.matches(FOCUSABLE)) focusTarget.setAttribute('tabindex', '-1');
  focusTarget?.focus();
}

export function useFocusOnNavigation(): void {
  const location = useLocation();
  const previousKey = useRef(location.key);

  useEffect(() => {
    if (location.key === previousKey.current) return;
    previousKey.current = location.key;

    if (location.hash) {
      focusById(decodeURIComponent(location.hash.slice(1)));
      return;
    }

    const target =
      document.getElementById(PAGE_HEADING_ID) ?? document.getElementById(MAIN_CONTENT_ID);
    target?.focus();
  }, [location]);
}
