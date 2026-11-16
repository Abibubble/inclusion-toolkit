import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { PAGE_HEADING_ID } from '../components/PageHeading';
import { MAIN_CONTENT_ID } from '../components/SkipLink';

/** Elements that can already take focus */
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';

/**
 * Focuses an element by id, so the next Tab carries on from there (WCAG 2.4.3). For a closed
 * <details> it focuses the <summary>
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
