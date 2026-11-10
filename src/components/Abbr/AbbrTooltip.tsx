import {
  type ReactNode,
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import styles from './AbbrTooltip.module.css';

const InsideLinkContext = createContext(false);

/**
 * For abbreviations inside a link. A button can't go inside a link, so they keep the plain
 * abbreviation, with the full form in its title
 */
export function PlainAbbreviations({ children }: { children: ReactNode }) {
  return <InsideLinkContext value>{children}</InsideLinkContext>;
}

const subscribe = () => () => undefined;

/** False when prerendering and hydrating, so the tooltip only takes over once JavaScript is running */
function useJavaScriptRunning(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** The space kept between the tooltip and the edge of the screen */
const EDGE = 8;

interface AbbrTooltipProps {
  fullForm: string;
  children: ReactNode;
}

/**
 * An abbreviation that shows its full form when hovered, focused or tapped (WCAG 1.4.13). The full
 * form stays while the pointer moves onto it, and Escape closes it. Without JavaScript, it's a plain
 * abbreviation, whose title the browser shows as a tooltip. Either way, the full form is also written
 * out the first time it's used, and in the list on the Glossary page
 */
export function AbbrTooltip({ fullForm, children }: AbbrTooltipProps) {
  const running = useJavaScriptRunning();
  const insideLink = use(InsideLinkContext);
  const [open, setOpen] = useState(false);
  const tooltip = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  // Moves the tooltip left if it would go past the right edge, so the page never scrolls sideways
  useLayoutEffect(() => {
    const element = tooltip.current;
    if (!open || !element) return;
    const overflow =
      element.getBoundingClientRect().right - (document.documentElement.clientWidth - EDGE);
    if (overflow > 0) element.style.translate = `${String(-overflow)}px 0`;
  }, [open]);

  if (!running || insideLink) return <abbr title={fullForm}>{children}</abbr>;

  return (
    // Hovering only adds to the button's focus and click, so the full form stays while the pointer
    // moves from the abbreviation onto it
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      className={styles.wrapper}
      onMouseEnter={() => {
        setOpen(true);
      }}
      onMouseLeave={() => {
        setOpen(false);
      }}
    >
      {/* aria-description is from ARIA 1.3, which the lint rule doesn't know yet. It gives the full
          form without adding its text to the page, so it isn't counted as part of the sentence */}
      {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
      <button
        type="button"
        className={styles.trigger}
        aria-description={fullForm}
        data-abbr
        onFocus={() => {
          setOpen(true);
        }}
        onBlur={() => {
          setOpen(false);
        }}
        onClick={() => {
          setOpen(true);
        }}
      >
        <abbr>{children}</abbr>
      </button>
      {open && (
        // Screen readers get the full form from the button's description, so this is only visual
        <span ref={tooltip} className={styles.tooltip} aria-hidden="true">
          <span className={styles.bubble}>{fullForm}</span>
        </span>
      )}
    </span>
  );
}
