import { useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';

import { MAIN_NAV } from '../../content/navigation';
import { ThemeSwitcher } from '../ThemeSwitcher';
import styles from './SiteNav.module.css';

export function SiteNav() {
  const { pathname } = useLocation();
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [openOnPath, setOpenOnPath] = useState<string | null>(null);
  const isOpen = openOnPath === pathname;

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      const focused = document.activeElement;
      const focusIsInMenu = focused === toggleRef.current || panelRef.current?.contains(focused);

      if (event.key === 'Escape' && focusIsInMenu) {
        setOpenOnPath(null);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          setOpenOnPath(isOpen ? null : pathname);
        }}
        data-print="hide"
      >
        <svg
          className={styles.icon}
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          {isOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        Menu
      </button>
      <div ref={panelRef} id={panelId} className={styles.panel} data-open={isOpen}>
        <nav aria-label="Main" data-print="hide">
          <ul role="list" className={styles.list}>
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className={styles.link}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.display}>
          <ThemeSwitcher layout="stacked" />
        </div>
      </div>
    </>
  );
}
