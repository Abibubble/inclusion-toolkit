import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { PAGE_HEADING_ID } from '../components/PageHeading';
import { MAIN_CONTENT_ID } from '../components/SkipLink';

export function useFocusOnNavigation(): void {
  const location = useLocation();
  const previousKey = useRef(location.key);

  useEffect(() => {
    if (location.key === previousKey.current) return;
    previousKey.current = location.key;

    if (location.hash) {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.focus();
      return;
    }

    const target =
      document.getElementById(PAGE_HEADING_ID) ?? document.getElementById(MAIN_CONTENT_ID);
    target?.focus();
  }, [location]);
}
