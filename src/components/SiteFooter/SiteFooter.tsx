import { FOOTER_NAV } from '../../content/navigation';
import { Container } from '../Container';
import { Link } from '../Link';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer} data-print="hide">
      <Container>
        <div className={styles.inner}>
          <nav aria-label="Footer">
            <ul role="list" className={styles.list}>
              {FOOTER_NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
