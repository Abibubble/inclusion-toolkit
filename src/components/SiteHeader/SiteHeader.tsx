import { MARK } from '../../brand/mark';
import { SITE_NAME } from '../../content/site';
import { Container } from '../Container';
import { Link } from '../Link';
import { ScreenReaderOnly } from '../ScreenReaderOnly';
import { SiteNav } from '../SiteNav';
import { ThemeSwitcher } from '../ThemeSwitcher';
import styles from './SiteHeader.module.css';

/**
 * The logo's mark, next to the site name. It's hidden from screen readers, as the name says the same.
 * The square is drawn 1 unit in, so the outline it gets in dark mode stays inside the mark
 */
function Mark() {
  return (
    <svg className={styles.mark} viewBox={MARK.viewBox} aria-hidden="true" focusable="false">
      <rect
        className={styles.markSquare}
        x="1"
        y="1"
        width="62"
        height="62"
        rx="13"
        fill={MARK.background}
        strokeWidth="2"
      />
      {MARK.shapes.map(({ x, y, width, height, radius, fill }) => (
        <rect key={`${String(x)},${String(y)}`} {...{ x, y, width, height, fill }} rx={radius} />
      ))}
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.inner}>
          <Link to="/" className={styles.siteName}>
            <Mark />
            <span>
              {SITE_NAME} <ScreenReaderOnly>home page</ScreenReaderOnly>
            </span>
          </Link>
          <SiteNav />
        </div>
      </Container>
      <div className={styles.subnav} data-print="hide">
        <Container>
          <div className={styles.subnavInner}>
            <ThemeSwitcher />
          </div>
        </Container>
      </div>
    </header>
  );
}
